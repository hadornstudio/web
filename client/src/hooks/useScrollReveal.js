import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../lib/motion/gsapConfig';

// Stagger fade-up on scroll into view. Uses autoAlpha + y transform only —
// compositor-only properties, so no layout reflow/CLS. Respects
// prefers-reduced-motion internally so callers never have to remember to opt out.
export function useScrollReveal({
  selector,
  y = 24,
  stagger = 0.08,
  start = 'top 80%',
  once = true,
  scrollTrigger = true,
  deps = [],
} = {}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const targets = selector ? ref.current.querySelectorAll(selector) : ref.current.children;
      if (!targets || targets.length === 0) return;

      if (prefersReducedMotion()) {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        return;
      }

      // fromTo with explicit end values (not `.from()`) — React 19 StrictMode double-invokes
      // this effect in dev, and `.from()` captures "current DOM state" as its implicit end
      // value, which is ambiguous on the second invocation and can leave elements stuck
      // mid-tween (e.g. opacity ~0.96 instead of 1). Explicit fromTo has no such ambiguity.
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: DURATION.base,
          ease: EASE.reveal,
          stagger,
          scrollTrigger: scrollTrigger
            ? { trigger: ref.current, start, once }
            : undefined,
        }
      );
    },
    // Re-runs when async-loaded data (e.g. products/categories arriving after a
    // loading-state render) causes the ref'd element to mount for the first time.
    { scope: ref, dependencies: deps }
  );

  return ref;
}
