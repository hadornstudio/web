// Finds how a close-up photo (zoomed in on the same front view) maps onto the full-length front photo:
// pixel_in_front = a + (pixel_in_closeup - c) / scale. Brute-force search over scale and offset on edge maps.
//   node align-closeup.mjs front.jpg closeup.jpg
import sharp from 'sharp';
const [, , frontPath, closePath] = process.argv;
const Q = 4; // search at 1/4 resolution first
async function edges(path, scale = 1) {
  const meta = await sharp(path).metadata();
  const w = Math.round((meta.width * scale) / Q), h = Math.round((meta.height * scale) / Q);
  const { data } = await sharp(path).greyscale().resize(w, h, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const e = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const gx = data[y * w + x + 1] - data[y * w + x - 1], gy = data[(y + 1) * w + x] - data[(y - 1) * w + x];
    e[y * w + x] = Math.hypot(gx, gy);
  }
  return { e, w, h };
}
const F = await edges(frontPath);
let best = { score: -1 };
for (let s = 2.2; s <= 3.8; s += 0.05) {
  const C = await edges(closePath, 1 / s); // close-up shrunk by s => same scale as the front photo
  // slide the shrunk close-up over the front photo's upper body (horizontal offset kept near centre)
  for (let oy = 0; oy <= F.h - C.h; oy += 1) for (let ox = Math.max(0, Math.round((F.w - C.w) / 2) - 14); ox <= Math.min(F.w - C.w, Math.round((F.w - C.w) / 2) + 14); ox += 1) {
    let sa = 0, sb = 0, sab = 0, saa = 0, sbb = 0, n = 0;
    for (let y = 0; y < C.h; y += 2) for (let x = 0; x < C.w; x += 2) {
      const a = F.e[(oy + y) * F.w + ox + x], b = C.e[y * C.w + x];
      sa += a; sb += b; sab += a * b; saa += a * a; sbb += b * b; n++;
    }
    const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
    const score = cov / Math.sqrt(va * vb + 1e-9);
    if (score > best.score) best = { score, s, ox: ox * Q, oy: oy * Q, cw: C.w * Q, ch: C.h * Q };
  }
}
console.log(JSON.stringify(best));
