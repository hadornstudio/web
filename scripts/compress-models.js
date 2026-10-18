// Optimises every .glb in assets-src/models -> client/public/models (dedup, prune, quantise,
// textures to WebP <= 2048px) and reports before/after sizes.
// Usage (repo root): node scripts/compress-models.js
// Meshopt/Draco are deliberately off: they make model-viewer fetch a decoder from a CDN at runtime,
// which isn't worth it for models this small. Turn on if a model passes the 3 MB budget.
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets-src/models');
const OUT = path.join(ROOT, 'client/public/models');
const BUDGET = 3 * 1024 * 1024;

mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const files = readdirSync(SRC).filter((f) => f.endsWith('.glb'));
if (!files.length) {
  console.error('No .glb files in assets-src/models');
  process.exit(1);
}

for (const file of files) {
  const doc = await io.read(path.join(SRC, file));
  await doc.transform(
    // Materials are NOT deduplicated: Metal and Charm look identical but must stay separately recolourable.
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
    prune(),
    quantize({ quantizePosition: 14 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048] })
  );
  await io.write(path.join(OUT, file), doc);
  const before = statSync(path.join(SRC, file)).size;
  const after = statSync(path.join(OUT, file)).size;
  const warn = after > BUDGET ? '  WARN: over the 3 MB budget' : '';
  console.log(`${file}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB${warn}`);
}
