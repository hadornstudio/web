// Lists each model's meshes, materials, triangle count and size so part names can be checked
// against the configurator JSON. Usage (repo root): node scripts/inspect-models.js [dir]
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(ROOT, process.argv[2] || 'client/public/models');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

for (const file of readdirSync(dir).filter((f) => f.endsWith('.glb'))) {
  const doc = await io.read(path.join(dir, file));
  const root = doc.getRoot();
  let tris = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      tris += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3;
    }
  }
  const b = getBounds(doc.getRoot().listScenes()[0]);
  const size = b.max.map((v, i) => ((v - b.min[i]) * 100).toFixed(1));
  console.log(`\n${file}`);
  console.log(`  triangles: ${Math.round(tris)}   size (cm): ${size.join(' x ')}`);
  console.log(`  materials: ${root.listMaterials().map((m) => m.getName()).join(', ')}`);
  console.log(`  nodes: ${root.listNodes().length}   meshes: ${root.listMeshes().length}`);
}
