import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

// Soft power-curve eases only — no bounce/elastic, matches the brand's quiet-luxury restraint.
export const EASE = {
  reveal: 'power3.out',
  hover: 'power2.out',
};

export const DURATION = {
  fast: 0.3,
  base: 0.6,
  slow: 0.9,
};

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, Flip };
