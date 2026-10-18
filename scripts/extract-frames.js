// Splits a film into AVIF (or WebP) frame sequences for the scroll-scrubbed canvas heroes.
// Usage: node scripts/extract-frames.js <hero|showroom> [--fps 24] [--quality 50] [--mobile-quality 50] [--format avif|webp]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SETS = {
  hero: {
    landscape: 'assets-src/hero/main-film.mp4',
    vertical: 'assets-src/hero/main-film-vertical.mp4',
    out: 'client/public/hero',
  },
  showroom: {
    landscape: 'assets-src/showroom/intro.mp4',
    vertical: 'assets-src/showroom/intro-vertical.mp4',
    out: 'client/public/showroom/intro',
  },
};

// AVIF keeps full-HD frames affordable (about half the size of WebP at the same look). Frames stream in
// progressively, so total weight matters less than the first ~20 frames — but budgets still flag runaway sizes.
const DEFAULTS = {
  format: 'avif',
  desktop: { width: 1920, quality: 50, budgetMb: 35 },
  mobile: { width: 720, quality: 50, budgetMb: 12 },
};
const BUDGET_MB = { desktop: DEFAULTS.desktop.budgetMb, mobile: DEFAULTS.mobile.budgetMb };

const args = process.argv.slice(2);
const setName = args[0];
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(args[i + 1]);
};
const fps = flag('fps', 24);
const argAfter = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const format = argAfter('format', DEFAULTS.format);
if (!SETS[setName]) {
  console.error(`Usage: node scripts/extract-frames.js <${Object.keys(SETS).join('|')}> [--fps N] [--quality N]`);
  process.exit(1);
}

const set = SETS[setName];
const quality = flag('quality', DEFAULTS.desktop.quality);
const mobileQuality = flag('mobile-quality', DEFAULTS.mobile.quality);
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

async function extract({ input, outDir, filter, q }) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  // Lossless PNG intermediates, so the final encode is the only lossy step.
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'hadorn-frames-'));
  try {
    const r = spawnSync(ffmpegPath, [
      '-v', 'error', '-y', '-i', input,
      '-vf', `fps=${fps},${filter}`,
      '-start_number', '1',
      path.join(tmp, 'frame_%04d.png'),
    ], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0) {
      console.error(r.stderr);
      process.exit(1);
    }
    const pngs = readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
    let next = 0;
    const encodeOne = async () => {
      while (next < pngs.length) {
        const name = pngs[next++];
        const out = path.join(outDir, name.replace('.png', `.${format}`));
        const img = sharp(path.join(tmp, name));
        if (format === 'avif') await img.avif({ quality: q, effort: 4, chromaSubsampling: '4:2:0' }).toFile(out);
        else await img.webp({ quality: q, effort: 5 }).toFile(out);
      }
    };
    await Promise.all(Array.from({ length: Math.max(2, os.cpus().length - 1) }, encodeOne));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const files = readdirSync(outDir).filter((f) => f.endsWith(`.${format}`));
  const bytes = files.reduce((sum, f) => sum + statSync(path.join(outDir, f)).size, 0);
  return { frames: files.length, bytes };
}

const src = probe(landscape);
const variants = [];

// Never upscale: AI films are often 720p, and stretching to 1920 only adds weight.
const desktopWidth = Math.min(DEFAULTS.desktop.width, src.width);
variants.push({
  name: 'desktop',
  input: landscape,
  filter: `scale=${desktopWidth}:-2`,
  q: quality,
});

if (existsSync(vertical)) {
  const v = probe(vertical);
  variants.push({ name: 'mobile', input: vertical, filter: `scale=${Math.min(DEFAULTS.mobile.width, v.width)}:-2`, q: mobileQuality });
} else {
  // No vertical film: centre-crop the landscape one to 9:16, then scale down to the phone width.
  variants.push({
    name: 'mobile',
    input: landscape,
    filter: `crop=trunc(ih*9/16/2)*2:ih,scale='min(${DEFAULTS.mobile.width},iw)':-2`,
    q: mobileQuality,
  });
}

console.log(`Source: ${path.relative(ROOT, landscape)} (${src.width}x${src.height}), fps ${fps}`);
for (const v of variants) {
  const outDir = path.join(ROOT, set.out, v.name);
  const { frames, bytes } = await extract({ input: v.input, outDir, filter: v.filter, q: v.q });
  const mb = bytes / 1024 / 1024;
  const dims = await sharp(path.join(outDir, `frame_0001.${format}`)).metadata();
  writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify({ frames, fps, width: dims.width, height: dims.height, ext: format }, null, 2)
  );
  const over = mb > BUDGET_MB[v.name];
  console.log(
    `${over ? 'WARN' : 'ok  '} ${v.name}: ${frames} frames, ${dims.width}x${dims.height}, ${mb.toFixed(1)} MB` +
      ` (budget ${BUDGET_MB[v.name]} MB, avg ${(bytes / frames / 1024).toFixed(0)} KB/frame)` +
      (over ? ` -> lower --fps (e.g. ${Math.round(fps * 0.75)}) or --quality` : '')
  );
}
