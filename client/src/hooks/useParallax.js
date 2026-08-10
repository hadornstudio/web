import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../lib/motion/gsapConfig';

// Continuous scroll-scrubbed movement — distinct from useScrollReveal's one-shot fade,
// since parallax ties directly to scroll position rather than firing once on entry.
export function useParallax({ amount = 60, start = 'top bottom', end = 'bottom top' } = {}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;

      gsap.fromTo(
        ref.current,
        { y: -amount / 2 },
        {
          y: amount / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start,
            end,
            scrub: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return ref;
}
