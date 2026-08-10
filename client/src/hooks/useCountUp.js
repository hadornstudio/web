import { useEffect, useRef, useState } from 'react';
import { gsap, DURATION, prefersReducedMotion } from '../lib/motion/gsapConfig';

// One-time count-up from 0 to `value` on mount/value-change. Ticks a plain JS
// number via GSAP (not a DOM property), so it works for arbitrary formatted display.
export function useCountUp(value) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0);
  const prevValue = useRef(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    if (prefersReducedMotion()) {
      setDisplay(value);
      prevValue.current = value;
      return;
    }

    const obj = { n: prevValue.current };
    const tween = gsap.to(obj, {
      n: value,
      duration: DURATION.slow,
      ease: 'power2.out',
      onUpdate: () => setDisplay(Math.round(obj.n)),
    });
    prevValue.current = value;

    return () => tween.kill();
  }, [value]);

  return display;
}
