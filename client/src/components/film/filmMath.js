export const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function smoothstep(a, b, x) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

// Scroll progress -> film progress. The first `until` of scroll only covers `frameShare` of the
// frames, so the bead curtain parts slowly and deliberately before the walk-through speeds up.
export function mapProgress(p, { until, frameShare }) {
  if (p < until) return (p / until) * frameShare;
  return frameShare + ((p - until) / (1 - until)) * (1 - frameShare);
}
