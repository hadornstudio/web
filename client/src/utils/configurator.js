// Client-side helpers for the 3D configurator. Prices computed here are for DISPLAY only — the
// server re-validates the selection and re-prices it at checkout (resolveConfiguration.js).

const PARAM_PREFIX = 'c_';

export const defaultOption = (part) => part.options.find((o) => o.isDefault) || part.options[0];

export function defaultSelection(config) {
  return {
    options: Object.fromEntries(config.parts.map((p) => [p.id, defaultOption(p).id])),
    addons: [],
  };
}

// Reads a shared-link selection (?c_beads=coral&c_clasp=gold&addons=charm), ignoring anything invalid.
export function selectionFromParams(config, params) {
  const selection = defaultSelection(config);
  for (const part of config.parts) {
    const wanted = params.get(PARAM_PREFIX + part.id);
    if (wanted && part.options.some((o) => o.id === wanted)) selection.options[part.id] = wanted;
  }
  const addons = (params.get('addons') || '').split(',').filter(Boolean);
  selection.addons = [...new Set(addons)].filter((id) => config.addons.some((a) => a.id === id));
  return selection;
}

export function selectionToParams(config, selection, existing = new URLSearchParams()) {
  const next = new URLSearchParams(existing);
  for (const part of config.parts) next.set(PARAM_PREFIX + part.id, selection.options[part.id]);
  if (selection.addons.length) next.set('addons', selection.addons.join(','));
  else next.delete('addons');
  return next;
}

export function selectionPriceDelta(config, selection) {
  const partsDelta = config.parts.reduce((sum, part) => {
    const option = part.options.find((o) => o.id === selection.options[part.id]);
    return sum + (option?.priceDelta || 0);
  }, 0);
  const addonsDelta = config.addons.reduce((sum, a) => sum + (selection.addons.includes(a.id) ? a.priceDelta || 0 : 0), 0);
  return partsDelta + addonsDelta;
}

// Stable string identifying one configuration, so different configs of one product are separate cart lines.
export function configKey(config, selection) {
  const opts = config.parts.map((p) => `${p.id}=${selection.options[p.id]}`).join('&');
  return `${opts}|${[...selection.addons].sort().join(',')}`;
}

export function selectionSummary(config, selection) {
  const lines = config.parts.map((part) => {
    const option = part.options.find((o) => o.id === selection.options[part.id]);
    return `${part.label}: ${option?.label}`;
  });
  for (const addon of config.addons) if (selection.addons.includes(addon.id)) lines.push(`Add-on: ${addon.label}`);
  return lines;
}
