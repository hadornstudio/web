// Turns a turntable video's frames + subject masks into transparent, tightly-cropped WebP frames for the showroom's
// photo-spin viewer.  node scripts/dress-from-photos/spin-frames.mjs <frames-dir> <masks-dir> <out-dir> [width=720]
// frames-dir: f_0001.jpg ...  masks-dir: f_0001.jpg.png ... (white = subject, from mask.swift)
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';

const [, , framesDir, masksDir, outDir, widthArg = '720'] = process.argv;
const OUT_W = +widthArg;
mkdirSync(outDir, { recursive: true });
const names = readdirSync(framesDir).filter((n) => n.endsWith('.jpg')).sort();

// shrink the cutout by ~1.5 px and soften it slightly, so no grey backdrop shows as a halo against the hall
async function cleanMask(name) {
  return sharp(`${masksDir}/${name}.png`).greyscale().blur(1.3).threshold(165).blur(0.7).raw().toBuffer({ resolveWithObject: true });
}

// pass 1: bounding box that covers the gown in every frame
let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, W = 0, H = 0;
for (const name of names) {
  const { data, info } = await cleanMask(name);
  W = info.width; H = info.height;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[y * W + x] > 100) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
const m = 8, left = Math.max(0, minX - m), top = Math.max(0, minY - m), width = Math.min(W - left, maxX - minX + 2 * m), height = Math.min(H - top, maxY - minY + 2 * m);
console.log(`gown covers x ${minX}-${maxX}, y ${minY}-${maxY} of ${W}x${H}; crop ${width}x${height}`);

// pass 2: composite colour + alpha, crop, resize, encode
let done = 0;
for (let i = 0; i < names.length; i++) {
  const { data: alpha, info } = await cleanMask(names[i]);
  const rgb = await sharp(`${framesDir}/${names[i]}`).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) { rgba[p * 4] = rgb[p * 3]; rgba[p * 4 + 1] = rgb[p * 3 + 1]; rgba[p * 4 + 2] = rgb[p * 3 + 2]; rgba[p * 4 + 3] = alpha[p]; }
  const out = `${outDir}/frame_${String(i + 1).padStart(4, '0')}.webp`;
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left, top, width, height }).resize(OUT_W).webp({ quality: 80, alphaQuality: 90, effort: 4 }).toFile(out);
  if (++done % 60 === 0) console.log(done, 'frames');
}
const outH = Math.round((OUT_W * height) / width);
writeFileSync(`${outDir}/meta.json`, JSON.stringify({ frames: names.length, width: OUT_W, height: outH, aspect: OUT_W / outH, ext: 'webp', pad: 4 }, null, 1));
console.log('wrote', names.length, 'frames,', OUT_W + 'x' + outH);
