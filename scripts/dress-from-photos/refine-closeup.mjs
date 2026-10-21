// Full-resolution refinement of align-closeup.mjs's answer: node refine-closeup.mjs front.jpg closeup.jpg ox oy scale
import sharp from 'sharp';
const [, , frontPath, closePath, ox0, oy0, s0] = process.argv;
async function edgesAt(path, width) {
  const { data, info } = await sharp(path).greyscale().resize(width, null, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, e = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) e[y * w + x] = Math.hypot(data[y * w + x + 1] - data[y * w + x - 1], data[(y + 1) * w + x] - data[(y - 1) * w + x]);
  return { e, w, h };
}
const F = await edgesAt(frontPath, 1116);
let best = { score: -1 };
for (let s = +s0 - 0.12; s <= +s0 + 0.12; s += 0.01) {
  const C = await edgesAt(closePath, Math.round(1116 / s));
  for (let oy = Math.round(+oy0) - 8; oy <= Math.round(+oy0) + 8; oy++) for (let ox = Math.round(+ox0) - 8; ox <= Math.round(+ox0) + 8; ox++) {
    let sa = 0, sb = 0, sab = 0, saa = 0, sbb = 0, n = 0;
    for (let y = 4; y < C.h - 4; y += 3) for (let x = 4; x < C.w - 4; x += 3) {
      const yy = oy + y, xx = ox + x; if (yy < 0 || xx < 0 || yy >= F.h || xx >= F.w) continue;
      const a = F.e[yy * F.w + xx], b = C.e[y * C.w + x]; sa += a; sb += b; sab += a * b; saa += a * a; sbb += b * b; n++;
    }
    const cov = sab / n - (sa / n) * (sb / n), va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2, score = cov / Math.sqrt(va * vb + 1e-9);
    if (score > best.score) best = { score: +score.toFixed(3), s: +s.toFixed(3), ox, oy };
  }
}
console.log(JSON.stringify(best));
