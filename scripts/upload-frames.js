// Uploads generated frame sequences to Cloudinary and writes client/src/config/frameSets.json
// (base URLs + frame counts the canvas heroes read at runtime).
// Usage (from repo root): node --env-file=server/.env scripts/upload-frames.js [hero|showroom]
// Bump REV after re-rendering frames so browsers/CDN don't serve the old ones.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REV = 'v1';
const CONCURRENCY = 8;

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary env vars missing. Run with: node --env-file=server/.env scripts/upload-frames.js');
  process.exit(1);
}
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const SETS = {
  hero: { key: 'hero', dir: 'client/public/hero', folder: 'hadorn-3d/hero' },
  showroom: { key: 'showroomIntro', dir: 'client/public/showroom/intro', folder: 'hadorn-3d/showroom-intro' },
};

const only = process.argv[2];
const names = only ? [only] : Object.keys(SETS);
if (names.some((n) => !SETS[n])) {
  console.error(`Unknown set. Use: ${Object.keys(SETS).join(' | ')}`);
  process.exit(1);
}

const configPath = path.join(ROOT, 'client/src/config/frameSets.json');
const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
mkdirSync(path.dirname(configPath), { recursive: true });

async function uploadPool(files, worker) {
  let next = 0;
  let done = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (next < files.length) {
      const file = files[next++];
      await worker(file);
      done += 1;
      if (done % 48 === 0 || done === files.length) process.stdout.write(`  ${done}/${files.length}\n`);
    }
  });
  await Promise.all(runners);
}

for (const name of names) {
  const set = SETS[name];
  config[set.key] = {};
  for (const variant of ['desktop', 'mobile']) {
    const dir = path.join(ROOT, set.dir, variant);
    if (!existsSync(dir)) {
      console.error(`Missing ${path.relative(ROOT, dir)} — run npm run frames:${name} first.`);
      process.exit(1);
    }
    const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    const files = readdirSync(dir).filter((f) => f.endsWith('.webp')).sort();
    const folder = `${set.folder}-${REV}/${variant}`;
    console.log(`${name}/${variant}: uploading ${files.length} frames -> ${folder}`);

    await uploadPool(files, async (file) => {
      await cloudinary.uploader.upload(path.join(dir, file), {
        public_id: file.replace(/\.webp$/, ''),
        folder,
        resource_type: 'image',
        overwrite: true,
        unique_filename: false,
        use_filename: false,
        invalidate: true,
      });
    });

    config[set.key][variant] = {
      base: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${folder}/`,
      frames: manifest.frames,
      width: manifest.width,
      height: manifest.height,
      fps: manifest.fps,
      pad: 4,
      ext: 'webp',
    };
  }
}

writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log(`Wrote ${path.relative(ROOT, configPath)}`);
