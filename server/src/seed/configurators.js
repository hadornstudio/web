import Product from '../models/Product.js';
import { configuratorsData } from './data/configurators.data.js';

// Attaches each configurator definition to its product (matched by exact title). Goes through
// document.save() so the schema's validation runs. Safe to re-run.
export async function applyConfigurators() {
  const results = [];
  for (const { title, configurator } of configuratorsData) {
    const product = await Product.findOne({ title });
    if (!product) {
      results.push(`skipped (no product titled "${title}")`);
      continue;
    }
    product.configurator = { enabled: true, ...configurator };
    await product.save();
    results.push(`configured "${title}"`);
  }
  return results;
}
