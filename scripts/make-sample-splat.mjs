// Writes a stand-in "beaded gown" as a .splat file (a few thousand coloured gaussians in the shape of a dress on a
// stand) so the showroom's 3D viewer can be built and tested before real captures exist.
//   node scripts/make-sample-splat.mjs [out.splat] [count]
import { writeFileSync } from 'node:fs';

const out = process.argv[2] || 'client/public/models/gallery/sample-dress.splat';
const count = Number(process.argv[3]) || 90000;

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// Silhouette radius by height (metres, 0 = hem, 1.6 = neckline), a fitted bodice flaring to a skirt.
const radius = (y) => {
  if (y < 0.9) return 0.2 + 0.26 * Math.pow(1 - y / 0.9, 1.4) + 0.02 * Math.sin(y * 9);
  if (y < 1.12) return 0.2 - 0.07 * ((y - 0.9) / 0.22); // waist
  if (y < 1.45) return 0.13 + 0.07 * Math.sin(((y - 1.12) / 0.33) * Math.PI) ; // bust
  return 0.12 - 0.05 * ((y - 1.45) / 0.15);
};
const PALETTE = [[196, 85, 59], [244, 237, 225], [201, 164, 92], [47, 166, 160], [31, 42, 68]];

const buf = Buffer.alloc(count * 32);
for (let i = 0; i < count; i++) {
  const y = rand() * 1.6;
  const a = rand() * Math.PI * 2;
  const r = radius(y) * (0.97 + rand() * 0.06);
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  // vertical stripes of colour with beaded variation
  const band = Math.floor(((a / (Math.PI * 2)) * 18 + y * 2.4) % PALETTE.length);
  const c = PALETTE[band];
  const sparkle = rand() < 0.07 ? 1.35 : 0.85 + rand() * 0.25;
  const size = 0.006 + rand() * 0.006;
  const o = i * 32;
  buf.writeFloatLE(x, o);
  buf.writeFloatLE(y, o + 4);
  buf.writeFloatLE(z, o + 8);
  buf.writeFloatLE(size, o + 12);
  buf.writeFloatLE(size, o + 16);
  buf.writeFloatLE(size, o + 20);
  buf[o + 24] = Math.min(255, c[0] * sparkle);
  buf[o + 25] = Math.min(255, c[1] * sparkle);
  buf[o + 26] = Math.min(255, c[2] * sparkle);
  buf[o + 27] = 235;
  // rotation quaternion (identity) packed as (q * 128 + 128)
  buf[o + 28] = 255; // w
  buf[o + 29] = 128;
  buf[o + 30] = 128;
  buf[o + 31] = 128;
}
writeFileSync(out, buf);
console.log(`wrote ${out}: ${count} splats, ${(buf.length / 1048576).toFixed(1)} MB`);
