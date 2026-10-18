import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion/gsapConfig';

// One shared Lenis instance for the home page only (started/stopped by HomePage), so the shop,
// checkout and admin keep native scrolling. Idempotent so child effects can reach it first.
let lenis = null;
let tick = null;

export function startLenis() {
  if (lenis || prefersReducedMotion()) return lenis;
  lenis = new Lenis({ lerp: 0.14, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis() {
  return lenis;
}

export function stopLenis() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  gsap.ticker.lagSmoothing(500, 33);
  lenis.destroy();
  lenis = null;
  tick = null;
}
