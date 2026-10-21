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
const SLEEVE_FRAC = [0.075, 0.43]; // where the sleeve tubes are drawn
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

// photo row for height fraction h (0 = floor, 1 = top of the mannequin cap)
const rowOf = (m, h) => m.bottom - h * (m.bottom - m.top);
const rowFromTop = (h) => 1 - h;
// real-world height (m) for a photo height fraction h
const yOf = (h) => (h < FLOOR_H ? FLOOR_Y * (h / FLOOR_H) : FLOOR_Y + (h - FLOOR_H) * (HEIGHT_M - FLOOR_Y) / (1 - FLOOR_H));

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

// ---- sleeves --------------------------------------------------------------------------------------------------------
const SL_ROWS = 80, SL_SEG = 20, bandM = BAND_PX * mpp;
const slPos = [], slUV = [], slIdx = [], slInfo = []; // slInfo: per vertex {side, h, phi}
for (const side of [-1, 1]) {
  const base = slPos.length / 3;
  for (let i = 0; i < SL_ROWS; i++) {
    const ft = lerp(SLEEVE_FRAC[0], SLEEVE_FRAC[1], i / (SL_ROWS - 1)), h = 1 - ft;
    const hi = clamp(Math.round(h * (ROWS - 1)), 0, ROWS - 1);
    const cx = side * (outerHW[hi] - bandM / 2);
    const taper = i > SL_ROWS * 0.6 ? lerp(1, 0.0, smooth(0, 1, (i - SL_ROWS * 0.6) / (SL_ROWS * 0.4))) : 1;
    for (let j = 0; j <= SL_SEG; j++) {
      const phi = (j / SL_SEG) * Math.PI * 2;
      slPos.push(cx + (bandM / 2) * taper * Math.sin(phi), yOf(h), z0[hi] + bandM * 0.62 * taper * Math.cos(phi));
      slUV.push((side < 0 ? 0 : 0.5) + (j / SL_SEG) * 0.5, 1 - i / (SL_ROWS - 1));
      slInfo.push({ side, h, phi, cx });
    }
  }
  for (let i = 0; i < SL_ROWS - 1; i++) for (let j = 0; j < SL_SEG; j++) {
    const a = base + i * (SL_SEG + 1) + j, b = a + 1, c = a + SL_SEG + 1, d = c + 1;
    slIdx.push(a, c, b, b, c, d);
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
const SL_TEX = 1024;
const slTex = Buffer.alloc(SL_TEX * SL_TEX * 3);
for (let j = 0; j < SL_TEX; j++) for (let k = 0; k < SL_TEX; k++) {
  const side = k < SL_TEX / 2 ? -1 : 1, u = (k % (SL_TEX / 2)) / (SL_TEX / 2), phi = u * Math.PI * 2, v = j / SL_TEX;
  const ft = lerp(SLEEVE_FRAC[0], SLEEVE_FRAC[1], v), h = 1 - ft, hi = clamp(Math.round(h * (ROWS - 1)), 0, ROWS - 1);
  const cxPx = side * (outerHW[hi] - bandM / 2) / mpp;
  const sinP = Math.sin(phi), cosP = Math.cos(phi);
  const fxp = fAxis + cxPx + (BAND_PX / 2) * sinP, bxp = bAxis - cxPx - (BAND_PX / 2) * sinP;
  const F = sample(fp, fxp, rowOf(fm, h)), B = sample(bp, bxp, rowOf(bm, h));
  const wf = smooth(-0.2, 0.4, cosP), wb = 1 - wf, o = (j * SL_TEX + k) * 3;
  for (let ch = 0; ch < 3; ch++) slTex[o + ch] = clamp(F[ch] * gain.f * wf + B[ch] * gain.b * wb, 0, 255);
}
const expose = (v) => 255 * Math.pow(clamp((v * EXPOSURE) / 255, 0, 1), GAMMA);
for (let i = 0; i < tex.length; i++) tex[i] = expose(tex[i]);
for (let i = 0; i < slTex.length; i++) slTex[i] = expose(slTex[i]);
const toJpeg = (buf, w, h) => sharp(buf, { raw: { width: w, height: h, channels: 3 } }).sharpen({ sigma: 0.9, m1: 0.8, m2: 1.6 }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
const [torsoJpg, sleeveJpg] = await Promise.all([toJpeg(tex, TEX_W, TEX_H), toJpeg(slTex, SL_TEX, SL_TEX)]);

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
function addMesh(name, pos, uv, idx, jpg) {
  const P = new Float32Array(pos), U = new Float32Array(uv), I = new Uint32Array(idx);
  // make sure triangles face outwards: the first torso triangle's normal should point away from the axis
  const N = normals(P, I);
  const tx = doc.createTexture(name + '-tex').setImage(new Uint8Array(jpg)).setMimeType('image/jpeg');
  const mat = doc.createMaterial(name).setBaseColorTexture(tx).setRoughnessFactor(1).setMetallicFactor(0).setDoubleSided(true);
  mat.setExtension('KHR_materials_unlit', unlitExt.createUnlit());
  const prim = doc.createPrimitive().setMaterial(mat).setIndices(doc.createAccessor().setType('SCALAR').setArray(I).setBuffer(buffer))
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(P).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(U).setBuffer(buffer));
  const mesh = doc.createMesh(name).addPrimitive(prim);
  scene.addChild(doc.createNode(name).setMesh(mesh));
}
addMesh('gown', torsoPos, torsoUV, torsoIdx, torsoJpg);
addMesh('sleeves', slPos, slUV, slIdx, sleeveJpg);
await new NodeIO().registerExtensions([KHRMaterialsUnlit]).write(outPath, doc);
console.log(`wrote ${outPath}  torso ${torsoPos.length / 3} verts, sleeves ${slPos.length / 3}; textures ${(torsoJpg.length / 1048576).toFixed(1)} + ${(sleeveJpg.length / 1048576).toFixed(1)} MB`);

console.log('built; check it in the showroom.');
