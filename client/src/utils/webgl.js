export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Budget phones and older laptops: few cores or little memory. The 3D scenes drop to 1x pixel ratio and no MSAA there.
export function isLowEndDevice() {
  if (typeof navigator === 'undefined') return false;
  const { hardwareConcurrency, deviceMemory } = navigator;
  return (hardwareConcurrency > 0 && hardwareConcurrency <= 4) || (deviceMemory > 0 && deviceMemory <= 4);
}

export function isTouchDevice() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}
