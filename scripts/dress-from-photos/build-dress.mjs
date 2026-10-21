// Builds a solid 3D gown (GLB) from studio photos: the shape comes from the subject outlines of a front, back and side
// photo (stacked rounded cross-sections, thin tubes for the sleeves), the surface colour from projecting the photos
// onto it. This is "sculpted from photos", not a scan: it matches the photographed angles and is a smooth estimate in
// between. Usage:  node scripts/dress-from-photos/build-dress.mjs <photos-dir> <masks-dir> <out.glb>
//   expects p6.jpg/m6.png (front), p2/m2 (back), p4/m4 (side, facing image-left).
import sharp from 'sharp';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { loadMask } from './silhouette.mjs';

const [, , photoDir = 'capture-work/photos', maskDir = 'capture-work/masks', outPath = 'capture-work/dress.glb'] = process.argv;
const HEIGHT_M = 1.76; // cap top to floor
const ROWS = 320, SEG = 120;
const TEX_W = 2048, TEX_H = 3072;
const FLOOR_H = 0.115; // the lowest ~12% of the photo is the train/hem lying on the floor, seen at a slant: flatten it
const FLOOR_Y = 0.025; // real height (m) the floor part is squashed into
const EXPOSURE = 1.16, GAMMA = 0.9; // the studio shots render the white gown at ~190/255; lift it so it reads as white
const BAND_PX = 54; // sleeve thickness in the front/back photos (px)
const SLEEVE_ZONE = [0.075, 0.47]; // rows of the photos in which sleeves/tassels overlap the torso outline and must be subtracted // sleeve spans this fraction of the height, measured from the top
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

async function loadPhoto(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
function sample(img, x, y) { // bilinear, RGB
  x = clamp(x, 0, img.w - 1.001); y = clamp(y, 0, img.h - 1.001);
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, o = (yy, xx) => (yy * img.w + xx) * 3;
  const out = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    const a = img.data[o(y0, x0) + c], b = img.data[o(y0, x0 + 1) + c], d = img.data[o(y0 + 1, x0) + c], e = img.data[o(y0 + 1, x0 + 1) + c];
    out[c] = lerp(lerp(a, b, fx), lerp(d, e, fx), fy);
  }
  return out;
}
function gauss(arr, sigma) { // smooth a profile along the height
  const r = Math.ceil(sigma * 3), w = [];
  for (let i = -r; i <= r; i++) w.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  return arr.map((_, i) => { let s = 0, ws = 0; for (let k = -r; k <= r; k++) { const j = clamp(i + k, 0, arr.length - 1); s += arr[j] * w[k + r]; ws += w[k + r]; } return s / ws; });
}

const [fm, bm, sm] = await Promise.all([loadMask(`${maskDir}/m6.png`), loadMask(`${maskDir}/m2.png`), loadMask(`${maskDir}/m4.png`)]);
const [fp, bp, sp] = await Promise.all([loadPhoto(`${photoDir}/p6.jpg`), loadPhoto(`${photoDir}/p2.jpg`), loadPhoto(`${photoDir}/p4.jpg`)]);
// High-resolution close-up of the front bodice, placed onto the front photo by align-closeup / refine-closeup:
// front_px = (ox, oy) + closeup_px / s.  Used instead of the front photo wherever it covers the gown.
const CLOSEUP = { file: 'p1.jpg', ox: 393, oy: 190, s: 3.24 };
const cp = await loadPhoto(`${photoDir}/${CLOSEUP.file}`);
const mpp = HEIGHT_M / (fm.bottom - fm.top); // metres per photo pixel (all three photos share a scale within ~2%)
const bandM = BAND_PX * mpp; // sleeve thickness seen from the front (m)

// photo row for height fraction h (0 = floor, 1 = top of the mannequin cap)
const rowOf = (m, h) => m.bottom - h * (m.bottom - m.top);
const rowFromTop = (h) => 1 - h;
// real-world height (m) for a photo height fraction h. The lowest part of the photo is the train lying on the floor, seen
// at a slant, so it gets little real height; the slope eases from "flat" to "normal" instead of changing abruptly.
const Y_TABLE = (() => {
  const n = 2000, t = [0];
  for (let i = 1; i <= n; i++) { const h = i / n, slope = lerp(FLOOR_Y / FLOOR_H, 2, smooth(FLOOR_H * 0.4, FLOOR_H * 2.4, h)); t.push(t[i - 1] + slope / n); }
  return t.map((v) => (v / t[n]) * HEIGHT_M);
})();
const yOf = (h) => { const f = clamp(h, 0, 1) * 2000, i = Math.min(1999, Math.floor(f)); return lerp(Y_TABLE[i], Y_TABLE[i + 1], f - i); };

// vertical axis of each photo = centre of the neck
function neckCentre(m) {
  let s = 0, n = 0;
  for (let f = 0.025; f <= 0.05; f += 0.005) { const y = Math.round(m.top + f * (m.bottom - m.top)); const r = m.runs[y]; if (r.length) { s += (r[0][0] + r[r.length - 1][1]) / 2; n++; } }
  return s / n;
}
const fAxis = neckCentre(fm), bAxis = neckCentre(bm), sAxis = neckCentre(sm);

// ---- per-row profiles -------------------------------------------------------------------------------------------
function frontRow(m, axis, h) {
  const y = Math.round(rowOf(m, h)), runs = m.runs[y];
  const outer = [runs[0][0], runs[runs.length - 1][1]];
  const ft = rowFromTop(h);
  const inSleeves = ft > SLEEVE_ZONE[0] && ft < SLEEVE_ZONE[1];
  let torso = outer;
  if (inSleeves) {
    const central = runs.find((r) => r[0] <= axis && r[1] >= axis);
    torso = runs.length >= 3 && central ? central : [outer[0] + BAND_PX, outer[1] - BAND_PX];
  }
  return { outer, torso };
}
const H = Array.from({ length: ROWS }, (_, i) => i / (ROWS - 1));
const fr = H.map((h) => frontRow(fm, fAxis, h));
const br = H.map((h) => frontRow(bm, bAxis, h));
// half widths (m): average front and back (mannequin is symmetric), smoothed
let halfW = gauss(H.map((_, i) => ((fr[i].torso[1] - fr[i].torso[0]) + (br[i].torso[1] - br[i].torso[0])) / 4 * mpp), 2.2);
const outerHW = gauss(H.map((_, i) => ((fr[i].outer[1] - fr[i].outer[0]) + (br[i].outer[1] - br[i].outer[0])) / 4 * mpp), 2.2);
// side view: front/back extents relative to the neck axis (image-left is the front of the dress)
const sideF = [], sideB = [];
for (const h of H) {
  const runs = sm.runs[Math.round(rowOf(sm, h))];
  sideF.push((sAxis - runs[0][0]) * mpp);
  sideB.push((sAxis - runs[runs.length - 1][1]) * mpp);
}
const zF = gauss(sideF, 2.2), zBraw = gauss(sideB, 2.2);
// The side photo is cropped at the train, so near the floor the true depth is larger than it shows: the train is a
// round-ish fan, so give the lowest part a depth of ~0.8x its width, extending backwards.
const zB = zBraw.map((zb, i) => {
  const floorW = smooth(0.30, 0.0, H[i]); // 0 above the knees, 1 at the floor
  const needBack = zF[i] - 2 * 0.8 * halfW[i];
  return lerp(zb, Math.min(zb, needBack), floorW);
});
// The sleeves hang over the hips in the photos, which makes the measured hip outline bumpy (it showed up as a ledge
// above the knee). Replace that band with a smooth curve between the clean rows above and below it.
function repair(arr, ftFrom, ftTo) {
  const idx = H.map((_, i) => i).filter((i) => 1 - H[i] >= ftFrom && 1 - H[i] <= ftTo);
  if (idx.length < 4) return arr;
  const i0 = idx[0] - 1, i1 = idx[idx.length - 1] + 1, span = i1 - i0, k = 10;
  const m0 = (arr[i0] - arr[i0 - k]) / k, m1 = (arr[i1 + k] - arr[i1]) / k; // slopes just outside the band (per row)
  const out = arr.slice();
  for (const i of idx) {
    const t = (i - i0) / span, t2 = t * t, t3 = t2 * t;
    out[i] = (2 * t3 - 3 * t2 + 1) * arr[i0] + (t3 - 2 * t2 + t) * m0 * span + (-2 * t3 + 3 * t2) * arr[i1] + (t3 - t2) * m1 * span;
  }
  return out;
}
halfW = gauss(repair(halfW, 0.34, 0.49), 3);
const zFs = gauss(repair(zF, 0.36, 0.50), 3), zBs = gauss(repair(zB, 0.36, 0.50), 3);
zF.splice(0, zF.length, ...zFs); zB.splice(0, zB.length, ...zBs);
{ // one more, wider smoothing pass that fades in only across the hips and knees
  const wide = (arr) => { const g = gauss(arr, 9); return arr.map((v, i) => lerp(v, g[i], smooth(0.36, 0.44, 1 - H[i]) * (1 - smooth(0.54, 0.62, 1 - H[i])))); };
  halfW = wide(halfW);
  const f2 = wide(zF), b2 = wide(zB); zF.splice(0, zF.length, ...f2); zB.splice(0, zB.length, ...b2);
}
const z0 = zF.map((zf, i) => (zf + zB[i]) / 2);
const depthHW = zF.map((zf, i) => Math.max(0.02, (zf - zB[i]) / 2));
halfW = halfW.map((w, i) => Math.max(0.02, w));

if (process.env.DEBUG_PROFILE) {
  for (let i = 0; i < ROWS; i += 8) console.log('from-top', (1 - H[i]).toFixed(2), 'torso hw', halfW[i].toFixed(3), 'outer hw', outerHW[i].toFixed(3), 'z0', z0[i].toFixed(3), 'depth hw', depthHW[i].toFixed(3));
}
// ---- torso mesh ---------------------------------------------------------------------------------------------------
const N_EXP = 2.3; // slightly boxier than an ellipse, like a fitted bodice
const sp2 = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / N_EXP);
const torsoPos = [], torsoUV = [], torsoIdx = [];
for (let i = 0; i < ROWS; i++) {
  for (let j = 0; j <= SEG; j++) {
    const th = (j / SEG) * Math.PI * 2; // 0 = front, +x to the right of the front photo
    torsoPos.push(halfW[i] * sp2(Math.sin(th)), yOf(H[i]), z0[i] + depthHW[i] * sp2(Math.cos(th)));
    torsoUV.push(j / SEG, 1 - H[i]);
  }
}
for (let i = 0; i < ROWS - 1; i++) for (let j = 0; j < SEG; j++) {
  const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1;
  torsoIdx.push(a, c, b, b, c, d); // wound for outward-facing normals (checked below)
}
// top cap (neck top)
const topC = torsoPos.length / 3;
torsoPos.push(0, yOf(H[ROWS - 1]), z0[ROWS - 1]); torsoUV.push(0.5, 0.0);
for (let j = 0; j < SEG; j++) torsoIdx.push(topC, (ROWS - 1) * (SEG + 1) + j + 1, (ROWS - 1) * (SEG + 1) + j);

// ---- sleeves ---------------------------------------------------------------------------------------------------------
// The sleeve is a sheer tube: ~5 cm thick seen from the front, ~12 cm across seen from the side, narrowing to the cuff,
// with a fringe of hanging bead strands. Its outline comes from the side photo (hand-traced edges, original pixels).
const SLEEVE_TRACE = [[270, 528, 645], [395, 523, 651], [553, 528, 625], [653, 534, 618], [770, 528, 608], [870, 523, 598], [906, 523, 594]]; // [photo row, front edge x, back edge x]
const SLEEVE_TOP_Y = SLEEVE_TRACE[0][0], CUFF_Y = SLEEVE_TRACE[SLEEVE_TRACE.length - 1][0];
function traceAt(y) {
  for (let i = 0; i < SLEEVE_TRACE.length - 1; i++) {
    const [y0, f0, b0] = SLEEVE_TRACE[i], [y1, f1, b1] = SLEEVE_TRACE[i + 1];
    if (y <= y1) { const t = clamp((y - y0) / (y1 - y0), 0, 1); return { xF: lerp(f0, f1, t), xB: lerp(b0, b1, t) }; }
  }
  const l = SLEEVE_TRACE[SLEEVE_TRACE.length - 1]; return { xF: l[1], xB: l[2] };
}
const hOfSideRow = (y) => 1 - (y - sm.top) / (sm.bottom - sm.top);
const SL_ROWS = 90, SL_SEG = 28;
function sleeveSection(t) { // t: 0 at the shoulder, 1 at the cuff
  const y = lerp(SLEEVE_TOP_Y, CUFF_Y, t), { xF, xB } = traceAt(y), h = hOfSideRow(y);
  const hi = clamp(Math.round(h * (ROWS - 1)), 0, ROWS - 1);
  return { y, h, rz: ((xB - xF) / 2) * mpp, zc: (sAxis - (xF + xB) / 2) * mpp, rx: bandM / 2 * lerp(1, 0.85, t), outer: outerHW[hi] };
}
const slPos = [], slUV = [], slIdx = [];
for (const side of [-1, 1]) {
  const base = slPos.length / 3;
  for (let i = 0; i < SL_ROWS; i++) {
    const sec = sleeveSection(i / (SL_ROWS - 1));
    for (let j = 0; j <= SL_SEG; j++) {
      const phi = (j / SL_SEG) * Math.PI * 2; // 0 = outer face centre, +pi/2 = front edge
      slPos.push(side * (sec.outer - sec.rx + sec.rx * Math.cos(phi)), yOf(sec.h), sec.zc + sec.rz * Math.sin(phi));
      slUV.push(j / SL_SEG, i / (SL_ROWS - 1));
    }
  }
  for (let i = 0; i < SL_ROWS - 1; i++) for (let j = 0; j < SL_SEG; j++) {
    const a2 = base + i * (SL_SEG + 1) + j, b2 = a2 + 1, c2 = a2 + SL_SEG + 1, d2 = c2 + 1;
    slIdx.push(a2, c2, b2, b2, c2, d2);
  }
  // cuff cap (the fringe hangs from it) and shoulder cap (hidden inside the shoulder)
  for (const [row, up] of [[SL_ROWS - 1, true], [0, false]]) {
    const sec = sleeveSection(row / (SL_ROWS - 1)), centre = slPos.length / 3;
    slPos.push(side * (sec.outer - sec.rx), yOf(sec.h), sec.zc); slUV.push(0.5, row / (SL_ROWS - 1));
    for (let j = 0; j < SL_SEG; j++) { const v0 = base + row * (SL_SEG + 1) + j; slIdx.push(centre, up ? v0 + 1 : v0, up ? v0 : v0 + 1); }
  }
}

// Hanging bead strands along the cuff: thin double-sided ribbons textured (with transparency) as a string of pearls.
const FR_N = 34, frPos = [], frUV = [], frIdx = [];
let rs = 5; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
for (const side of [-1, 1]) {
  const cuff = sleeveSection(1);
  for (let k = 0; k < FR_N; k++) {
    const phi = (k / FR_N) * Math.PI * 2;
    const cx = side * (cuff.outer - cuff.rx + cuff.rx * 0.98 * Math.cos(phi)), cz = cuff.zc + cuff.rz * 0.98 * Math.sin(phi);
    const len = 0.062 * (0.78 + 0.4 * rnd()), top = yOf(cuff.h) + 0.004, w = 0.0045;
    // ribbon faces outwards from the tube axis
    const nx = side * Math.cos(phi), nz = Math.sin(phi), tx = -nz, tz = nx;
    const base = frPos.length / 3;
    frPos.push(cx - tx * w, top, cz - tz * w, cx + tx * w, top, cz + tz * w, cx + tx * w + nx * 0.004, top - len, cz + tz * w + nz * 0.004, cx - tx * w + nx * 0.004, top - len, cz - tz * w + nz * 0.004);
    frUV.push(0, 0, 1, 0, 1, 1, 0, 1);
    frIdx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  }
}

// ---- textures -----------------------------------------------------------------------------------------------------
// Gain so the three photos have the same average brightness over the gown (they were lit slightly differently).
function meanLum(p, m) { let s = 0, n = 0; for (let y = m.top; y < m.bottom; y += 7) for (let x = 0; x < p.w; x += 7) if (m.on(x, y)) { const o = (y * p.w + x) * 3; s += p.data[o] + p.data[o + 1] + p.data[o + 2]; n++; } return s / n; }
const lf = meanLum(fp, fm), lb = meanLum(bp, bm), ls = meanLum(sp, sm), lAvg = (lf + lb + ls) / 3;
const gain = { f: lAvg / lf, b: lAvg / lb, s: lAvg / ls };
// brightness of the close-up relative to the front photo over the area they share
{ let a = 0, b = 0, n = 0;
  for (let y = 40; y < cp.h - 40; y += 9) for (let x = 40; x < cp.w - 40; x += 9) {
    const fx = CLOSEUP.ox + x / CLOSEUP.s, fy = CLOSEUP.oy + y / CLOSEUP.s;
    if (!fm.on(Math.round(fx), Math.round(fy))) continue;
    const F0 = sample(fp, fx, fy), C0 = sample(cp, x, y);
    a += F0[0] + F0[1] + F0[2]; b += C0[0] + C0[1] + C0[2]; n++;
  }
  gain.c = a / b; console.log('close-up gain', gain.c.toFixed(3), 'over', n, 'samples'); }
console.log('photo brightness gain', gain);

// Where a gown point seen from each photo lands: the cross-section is stretched to the photographed silhouette, so
// edges line up exactly.
function frontUV(m, axis, mirror, h, sinTh, rowsInfo, i) {
  const t = rowsInfo[i].torso, y = rowOf(m, h);
  const u = mirror ? 1 - (sinTh + 1) / 2 : (sinTh + 1) / 2; // back photo is mirrored left-right
  return [lerp(t[0] + 2, t[1] - 2, u), y];
}
function sideUVfn(h, cosTh, mirrorSide) {
  const runs = sm.runs[Math.round(rowOf(sm, h))], x0 = runs[0][0] + 2, x1 = runs[runs.length - 1][1] - 2;
  return [lerp(x0, x1, (1 - cosTh) / 2), rowOf(sm, h)];
}

const tex = Buffer.alloc(TEX_W * TEX_H * 3);
for (let j = 0; j < TEX_H; j++) {
  const h = 1 - (j + 0.5) / TEX_H;
  const i = clamp(Math.round(h * (ROWS - 1)), 0, ROWS - 1);
  for (let k = 0; k < TEX_W; k++) {
    const th = ((k + 0.5) / TEX_W) * Math.PI * 2, s = Math.sin(th), c = Math.cos(th);
    const wf = smooth(-0.15, 0.55, c), wb = smooth(-0.15, 0.55, -c), ws = smooth(0.35, 0.97, Math.abs(s));
    const sum = wf + wb + ws + 1e-6;
    const [fx, fy] = frontUV(fm, fAxis, false, h, s, fr, i);
    const [bx, by] = frontUV(bm, bAxis, true, h, s, br, i);
    // the side photo shows the gown's left side = +x (image-right of the front photo); mirror it for -x
    const [sx, sy] = sideUVfn(h, c, s > 0);
    let F = sample(fp, fx, fy);
    // swap in the sharper close-up where it covers this point (feathered at its edges)
    const cx = (fx - CLOSEUP.ox) * CLOSEUP.s, cy = (fy - CLOSEUP.oy) * CLOSEUP.s;
    const edge = Math.min(cx, cp.w - cx, cy, cp.h - cy);
    if (edge > 0) { const wc = smooth(0, 90, edge) * wf / Math.max(wf, 1e-6); const C = sample(cp, cx, cy); F = F.map((v, ch) => lerp(v, C[ch] * gain.c / gain.f, wc)); }
    const B = sample(bp, bx, by), S = sample(sp, sx, sy);
    const o = (j * TEX_W + k) * 3;
    for (let ch = 0; ch < 3; ch++) tex[o + ch] = clamp((F[ch] * gain.f * wf + B[ch] * gain.b * wb + S[ch] * gain.s * ws) / sum, 0, 255);
  }
}
const SL_W = 512, SL_H = 1536;
const slTex = Buffer.alloc(SL_W * SL_H * 3);
for (let j = 0; j < SL_H; j++) {
  const t = (j + 0.5) / SL_H, y = lerp(SLEEVE_TOP_Y, CUFF_Y, t), { xF, xB } = traceAt(y);
  for (let k = 0; k < SL_W; k++) {
    const phi = ((k + 0.5) / SL_W) * Math.PI * 2, sinP = Math.sin(phi);
    // the side photo shows the sleeve's wide face; front edge = image-left; the far half repeats the same sheer pattern
    const x = lerp(xF + 2, xB - 2, (1 - sinP) / 2);
    const C = sample(sp, x, y), o = (j * SL_W + k) * 3;
    for (let ch = 0; ch < 3; ch++) slTex[o + ch] = clamp(C[ch] * gain.s, 0, 255);
  }
}
// bead-strand texture (RGBA): a thread with pearls, transparent elsewhere
const ST_W = 32, ST_H = 256, strand = Buffer.alloc(ST_W * ST_H * 4);
for (let y = 0; y < ST_H; y++) for (let x = 0; x < ST_W; x++) {
  const cy = (y % 12) - 6, cx = x - ST_W / 2 + 0.5, d = Math.hypot(cx, cy), o = (y * ST_W + x) * 4;
  let a = 0, v = 0;
  if (d < 5.2) { a = 255; v = 244 - 46 * (d / 5.2) ** 2 + 18 * Math.max(0, 1 - Math.hypot(cx + 1.6, cy + 1.8) / 2.6); }
  else if (Math.abs(cx) < 1) { a = 255; v = 214; }
  strand[o] = strand[o + 1] = clamp(v, 0, 255); strand[o + 2] = clamp(v - 6, 0, 255); strand[o + 3] = a;
}
const expose = (v) => 255 * Math.pow(clamp((v * EXPOSURE) / 255, 0, 1), GAMMA);
for (let i = 0; i < tex.length; i++) tex[i] = expose(tex[i]);
for (let i = 0; i < slTex.length; i++) slTex[i] = expose(slTex[i]);
const strandPng = await sharp(strand, { raw: { width: ST_W, height: ST_H, channels: 4 } }).png().toBuffer();
const toJpeg = (buf, w, h) => sharp(buf, { raw: { width: w, height: h, channels: 3 } }).sharpen({ sigma: 0.9, m1: 0.8, m2: 1.6 }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
const [torsoJpg, sleeveJpg] = await Promise.all([toJpeg(tex, TEX_W, TEX_H), toJpeg(slTex, SL_W, SL_H)]);

// ---- glTF ---------------------------------------------------------------------------------------------------------
function normals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const e1 = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]], e2 = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
    const f = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    for (const v of [a, b, c]) { n[v] += f[0]; n[v + 1] += f[1]; n[v + 2] += f[2]; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
const doc = new Document();
const unlitExt = doc.createExtension(KHRMaterialsUnlit);
const buffer = doc.createBuffer();
const scene = doc.createScene('dress');
function addMesh(name, pos, uv, idx, jpg, opts = {}) {
  const P = new Float32Array(pos), U = new Float32Array(uv), I = new Uint32Array(idx);
  // make sure triangles face outwards: the first torso triangle's normal should point away from the axis
  const N = normals(P, I);
  const tx = doc.createTexture(name + '-tex').setImage(new Uint8Array(jpg)).setMimeType(opts.png ? 'image/png' : 'image/jpeg');
  const mat = doc.createMaterial(name).setBaseColorTexture(tx).setRoughnessFactor(1).setMetallicFactor(0).setDoubleSided(true);
  mat.setExtension('KHR_materials_unlit', unlitExt.createUnlit());
  if (opts.png) mat.setAlphaMode('MASK').setAlphaCutoff(0.5);
  const prim = doc.createPrimitive().setMaterial(mat).setIndices(doc.createAccessor().setType('SCALAR').setArray(I).setBuffer(buffer))
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(P).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(U).setBuffer(buffer));
  const mesh = doc.createMesh(name).addPrimitive(prim);
  scene.addChild(doc.createNode(name).setMesh(mesh));
}
addMesh('gown', torsoPos, torsoUV, torsoIdx, torsoJpg);
addMesh('sleeves', slPos, slUV, slIdx, sleeveJpg);
addMesh('fringe', frPos, frUV, frIdx, strandPng, { png: true });
await new NodeIO().registerExtensions([KHRMaterialsUnlit]).write(outPath, doc);
console.log(`wrote ${outPath}  torso ${torsoPos.length / 3} verts, sleeves ${slPos.length / 3}, fringe strands ${frPos.length / 12}; textures ${(torsoJpg.length / 1048576).toFixed(1)} + ${(sleeveJpg.length / 1048576).toFixed(1)} MB`);

console.log('built; check it in the showroom.');
