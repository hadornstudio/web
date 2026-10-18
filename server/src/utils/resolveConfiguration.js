import { ApiError } from './ApiError.js';

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

// Validates a customer's configurator selection against the product's stored configurator and
// returns the price delta plus a readable summary for the order. The client's own price maths is
// display-only: this is the only place the configured price is decided.
//   selection: { options?: { [partId]: optionId }, addons?: [addonId] }
export function resolveConfiguration(product, selection = {}) {
  const options = selection.options && typeof selection.options === 'object' ? selection.options : {};
  const addons = Array.isArray(selection.addons) ? selection.addons : [];
  const config = product.configurator;
  const wantsConfig = Object.keys(options).length > 0 || addons.length > 0;

  if (!config?.enabled) {
    if (wantsConfig) throw new ApiError(422, `"${product.title}" cannot be customised`);
    return { priceDelta: 0, summary: [], chosen: undefined };
  }

  const known = new Set(config.parts.map((p) => p.id));
  for (const key of Object.keys(options)) {
    if (!known.has(key)) throw new ApiError(422, `Unknown option "${key}" for "${product.title}"`);
  }

  let priceDelta = 0;
  const summary = [];
  const chosen = { options: {}, addons: [] };

  for (const part of config.parts) {
    // Unspecified parts fall back to the option flagged isDefault (else the first), matching the viewer.
    const fallback = (part.options.find((o) => o.isDefault) || part.options[0]).id;
    const wanted = has(options, part.id) ? options[part.id] : fallback;
    const option = part.options.find((o) => o.id === wanted);
    if (!option) throw new ApiError(422, `Invalid choice for ${part.label} on "${product.title}"`);
    priceDelta += option.priceDelta || 0;
    summary.push({ part: part.label, option: option.label });
    chosen.options[part.id] = option.id;
  }

  if (new Set(addons).size !== addons.length) throw new ApiError(422, 'Duplicate add-ons');
  for (const id of addons) {
    const addon = config.addons.find((a) => a.id === id);
    if (!addon) throw new ApiError(422, `Unknown add-on "${id}" for "${product.title}"`);
    priceDelta += addon.priceDelta || 0;
    summary.push({ part: 'Add-on', option: addon.label });
    chosen.addons.push(addon.id);
  }

  return { priceDelta, summary, chosen };
}
