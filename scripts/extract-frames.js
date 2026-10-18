// Splits a film into WebP frame sequences for the scroll-scrubbed canvas heroes.
// Usage: node scripts/extract-frames.js <hero|showroom> [--fps 24] [--quality 80] [--mobile-quality 72]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SETS = {
  hero: {
    landscape: 'assets-src/hero/main-film.mp4',
    vertical: 'assets-src/hero/main-film-vertical.mp4',
    out: 'client/public/hero',
    quality: 62, // dense bead-curtain detail: 80 gives 25 MB, 62 fits the 20 MB budget
  },
  showroom: {
    landscape: 'assets-src/showroom/intro.mp4',
    vertical: 'assets-src/showroom/intro-vertical.mp4',
    out: 'client/public/showroom/intro',
  },
};

const BUDGET_MB = { desktop: 20, mobile: 8 };

const args = process.argv.slice(2);
const setName = args[0];
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};
const fps = flag('fps', 24);
if (!SETS[setName]) {
  console.error(`Usage: node scripts/extract-frames.js <${Object.keys(SETS).join('|')}> [--fps N] [--quality N]`);
  process.exit(1);
}

const set = SETS[setName];
const quality = flag('quality', set.quality ?? 80);
const mobileQuality = flag('mobile-quality', 72);
const landscape = path.join(ROOT, set.landscape);
const vertical = path.join(ROOT, set.vertical);

if (!existsSync(landscape)) {
  console.error(`Missing ${set.landscape}. Put the landscape film there and re-run.`);
  process.exit(1);
}

function probe(file) {
  const r = spawnSync(ffprobe.path, [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', file,
  ], { encoding: 'utf8' });
  const [width, height] = r.stdout.trim().split('x').map(Number);
  return { width, height };
}

function extract({ input, outDir, filter, q }) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const r = spawnSync(ffmpegPath, [
    '-v', 'error', '-y', '-i', input,
    '-vf', `fps=${fps},${filter}`,
    '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6',
    '-start_number', '1',
    path.join(outDir, 'frame_%04d.webp'),
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  const files = readdirSync(outDir).filter((f) => f.endsWith('.webp'));
  const bytes = files.reduce((sum, f) => sum + statSync(path.join(outDir, f)).size, 0);
  return { frames: files.length, bytes, first: path.join(outDir, files.sort()[0]) };
}

const src = probe(landscape);
const variants = [];

// Never upscale: AI films are often 720p, and stretching to 1920 only adds weight.
const desktopWidth = Math.min(1920, src.width);
variants.push({
  name: 'desktop',
  input: landscape,
  filter: `scale=${desktopWidth}:-2`,
  q: quality,
});

if (existsSync(vertical)) {
  const v = probe(vertical);
  variants.push({ name: 'mobile', input: vertical, filter: `scale=${Math.min(1080, v.width)}:-2`, q: mobileQuality });
} else {
  // No vertical film: centre-crop the landscape one to 9:16 at native resolution.
  variants.push({
    name: 'mobile',
    input: landscape,
    filter: 'crop=trunc(ih*9/16/2)*2:ih',
    q: mobileQuality,
  });
}

console.log(`Source: ${path.relative(ROOT, landscape)} (${src.width}x${src.height}), fps ${fps}`);
for (const v of variants) {
  const outDir = path.join(ROOT, set.out, v.name);
  const { frames, bytes } = extract({ input: v.input, outDir, filter: v.filter, q: v.q });
  const mb = bytes / 1024 / 1024;
  const dims = probe(path.join(outDir, 'frame_0001.webp'));
  writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ frames, fps, width: dims.width, height: dims.height, pattern: 'frame_%04d.webp' }, null, 2)
  );
  const over = mb > BUDGET_MB[v.name];
  console.log(
    `${over ? 'WARN' : 'ok  '} ${v.name}: ${frames} frames, ${dims.width}x${dims.height}, ${mb.toFixed(1)} MB` +
      ` (budget ${BUDGET_MB[v.name]} MB, avg ${(bytes / frames / 1024).toFixed(0)} KB/frame)` +
      (over ? ` -> lower --fps (e.g. ${Math.round(fps * 0.75)}) or --quality` : '')
  );
}
