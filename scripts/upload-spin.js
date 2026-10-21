// Uploads the frames of a photo-spin piece to Cloudinary and prints what to enter in Admin -> Gallery -> 3D model.
//   node --env-file=server/.env scripts/upload-spin.js <frames-folder> <name>
//   e.g. node --env-file=server/.env scripts/upload-spin.js client/public/spin/wedding wedding
// Frames come from scripts/dress-from-photos/spin-frames.mjs (transparent WebP, frame_0001.webp ...).
// Bump REV if you re-render the frames, so browsers/CDN don't serve the old ones.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

const REV = 'v1';
const [, , dir, name] = process.argv;
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!dir || !name) { console.error('usage: node --env-file=server/.env scripts/upload-spin.js <frames-folder> <name>'); process.exit(1); }
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) { console.error('Cloudinary env vars missing (use --env-file=server/.env)'); process.exit(1); }
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });

const files = readdirSync(dir).filter((f) => /^frame_\d{4}\.webp$/.test(f)).sort();
if (!files.length) { console.error('No frame_0001.webp ... files found in', dir); process.exit(1); }
const folder = `hadorn-3d/spin/${name}-${REV}`;
console.log(`uploading ${files.length} frames -> ${folder}`);
let next = 0, done = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < files.length) {
    const file = files[next++];
    await cloudinary.uploader.upload(path.join(dir, file), { public_id: file.replace(/\.\w+$/, ''), folder, resource_type: 'image', overwrite: true, unique_filename: false, use_filename: false, invalidate: true });
    if (++done % 50 === 0 || done === files.length) console.log(`  ${done}/${files.length}`);
  }
}));
let meta = {}; try { meta = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8')); } catch { /* optional */ }
console.log('\nIn Admin -> Gallery -> 3D model choose "Photo spin" and enter:');
console.log(`  Link to the frames folder: https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/`);
console.log(`  Number of frames: ${files.length}`);
console.log('  Mirror-fill frames: 60 if the clip stops short of a full turn (the missing arc is filled by playing that many early frames backwards, mirrored), -1 if it is a full turn');
if (meta.aspect) console.log(`  (frames are ${meta.width}x${meta.height})`);
