// Converts a trained 3D Gaussian Splatting .ply (what Brush, OpenSplat, nerfstudio, Luma, Polycam and KIRI Engine
// export) into the compact .splat format the showroom viewer loads, optionally cleaning it up on the way:
//   node scripts/ply-to-splat.mjs input.ply output.splat [options]
//     --max N        keep only the N most visible splats (default 600000; a phone handles ~400k comfortably)
//     --crop MODE    auto (default) drops stray floaters and far-off background: anything further from the subject than
//                    1.5x the radius that holds 80% of the splats. off keeps everything.
//     --radius M     extra hard cut: keep only splats within M metres (after scaling to --height) of the subject's
//                    centre line. Use it when a capture includes the room around the dress.
//     --up AXIS      which capture axis points up: +x -x +y -y +z -z (default -y, typical of COLMAP-based tools)
//     --height M     scale so the subject is M metres tall (default 1.7). The viewer then only needs fine-tuning.
//     --opacity T    drop splats with opacity below T, 0-1 (default 0.06)
// The result is centred on the origin, standing on y = 0, sorted most-visible first.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inPath, outPath, ...rest] = process.argv;
if (!inPath || !outPath) {
  console.error('usage: node scripts/ply-to-splat.mjs input.ply output.splat [--max N] [--crop P] [--up -y] [--height M] [--opacity T]');
  process.exit(1);
}
const opt = { max: 600000, crop: 'auto', radius: 0, up: '-y', height: 1.7, opacity: 0.06 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = isNaN(+rest[i + 1]) ? rest[i + 1] : +rest[i + 1];

const file = readFileSync(inPath);
const headerEnd = file.indexOf('end_header\n') + 'end_header\n'.length;
const header = file.subarray(0, headerEnd).toString('latin1');
if (!header.includes('binary_little_endian')) throw new Error('Only binary little-endian .ply files are supported');
const n = Number(/element vertex (\d+)/.exec(header)[1]);
const props = [...header.matchAll(/property (\w+) (\w+)/g)].map((m) => ({ type: m[1], name: m[2] }));
const SIZE = { float: 4, double: 8, uchar: 1, char: 1, ushort: 2, short: 2, uint: 4, int: 4 };
const offsets = {};
let stride = 0;
for (const p of props) {
  offsets[p.name] = stride;
  stride += SIZE[p.type];
}
for (const need of ['x', 'y', 'z', 'scale_0', 'rot_0', 'opacity', 'f_dc_0']) if (!(need in offsets)) throw new Error(`Not a Gaussian splat .ply (missing "${need}")`);
const view = new DataView(file.buffer, file.byteOffset + headerEnd, n * stride);
const f = (i, name) => view.getFloat32(i * stride + offsets[name], true);

const SH0 = 0.28209479177387814;
const sigmoid = (v) => 1 / (1 + Math.exp(-v));
const upMap = { '+x': [1, 0, 0], '-x': [-1, 0, 0], '+y': [0, 1, 0], '-y': [0, -1, 0], '+z': [0, 0, 1], '-z': [0, 0, -1] };
const up = upMap[opt.up];
if (!up) throw new Error(`--up must be one of ${Object.keys(upMap).join(' ')}`);

// Rotation taking `up` onto +y: axis = up x y, angle = acos(up . y).
function alignQuat() {
  const dot = up[1];
  if (dot > 0.9999) return [1, 0, 0, 0];
  if (dot < -0.9999) return [0, 1, 0, 0]; // 180 deg about x
  const ax = [up[1] * 0 - up[2] * 1, up[2] * 0 - up[0] * 0, up[0] * 1 - up[1] * 0];
  const len = Math.hypot(...ax);
  const half = Math.acos(dot) / 2;
  const s = Math.sin(half) / len;
  return [Math.cos(half), ax[0] * s, ax[1] * s, ax[2] * s];
}
const Q = alignQuat();
const qmul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
function rotate(q, v) {
  const [w, x, y, z] = q;
  const t = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
  return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])];
}

// 1. read, filter by opacity, orient
let items = [];
for (let i = 0; i < n; i++) {
  const alpha = sigmoid(f(i, 'opacity'));
  if (alpha < opt.opacity) continue;
  const s = [Math.exp(f(i, 'scale_0')), Math.exp(f(i, 'scale_1')), Math.exp(f(i, 'scale_2'))];
  const pos = rotate(Q, [f(i, 'x'), f(i, 'y'), f(i, 'z')]);
  items.push({ i, alpha, s, pos, vis: alpha * s[0] * s[1] * s[2] });
}
if (!items.length) throw new Error('No splats left after the opacity filter');

// 2. find the subject: weighted-median centre, then keep everything within the crop percentile of that centre
const median = (arr) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)];
const cx = median(items.map((t) => t.pos[0]));
const cz = median(items.map((t) => t.pos[2]));
if (opt.crop !== 'off') {
  const d = items.map((t) => Math.hypot(t.pos[0] - cx, t.pos[2] - cz)).sort((a, b) => a - b);
  const limit = d[Math.floor(d.length * 0.8)] * 1.5;
  items = items.filter((t) => Math.hypot(t.pos[0] - cx, t.pos[2] - cz) <= limit);
}
// vertical extent from the 1st-99th percentile so stray floaters don't set the height
const ys = items.map((t) => t.pos[1]).sort((a, b) => a - b);
const y0 = ys[Math.floor(ys.length * 0.01)];
const y1 = ys[Math.floor(ys.length * 0.99)];
const k = opt.height / Math.max(1e-6, y1 - y0);
if (opt.radius > 0) items = items.filter((t) => Math.hypot(t.pos[0] - cx, t.pos[2] - cz) * k <= opt.radius);
items = items.filter((t) => t.pos[1] >= y0 - 0.03 * (y1 - y0) && t.pos[1] <= y1 + 0.05 * (y1 - y0));

// 3. most visible first, cap the count
items.sort((a, b) => b.vis - a.vis);
if (items.length > opt.max) items.length = opt.max;

const out = Buffer.alloc(items.length * 32);
items.forEach((t, j) => {
  const o = j * 32;
  out.writeFloatLE((t.pos[0] - cx) * k, o);
  out.writeFloatLE((t.pos[1] - y0) * k, o + 4);
  out.writeFloatLE((t.pos[2] - cz) * k, o + 8);
  out.writeFloatLE(t.s[0] * k, o + 12);
  out.writeFloatLE(t.s[1] * k, o + 16);
  out.writeFloatLE(t.s[2] * k, o + 20);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  out[o + 24] = clamp((0.5 + SH0 * f(t.i, 'f_dc_0')) * 255);
  out[o + 25] = clamp((0.5 + SH0 * f(t.i, 'f_dc_1')) * 255);
  out[o + 26] = clamp((0.5 + SH0 * f(t.i, 'f_dc_2')) * 255);
  out[o + 27] = clamp(t.alpha * 255);
  // splat rotation, re-oriented with the same alignment, normalised and packed as (q * 128 + 128)
  let q = [f(t.i, 'rot_0'), f(t.i, 'rot_1'), f(t.i, 'rot_2'), f(t.i, 'rot_3')];
  const len = Math.hypot(...q) || 1;
  q = qmul(Q, q.map((c) => c / len));
  q.forEach((c, m) => (out[o + 28 + m] = clamp(c * 128 + 128)));
});
writeFileSync(outPath, out);
console.log(`${inPath}: ${n} splats -> ${items.length} kept, ${(out.length / 1048576).toFixed(1)} MB, ${opt.height} m tall`);
