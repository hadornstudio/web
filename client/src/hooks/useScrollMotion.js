import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../lib/motion/gsapConfig';

// Scroll-linked ("scrubbed") motion for a home-page section. Mark things up, call the hook on the section:
//   [data-split]    heading whose words slide in from alternating sides as it scrolls into view
//   [data-drift=N]  element that travels N px up (or down, if negative) over the time the section is on screen,
//                   so neighbouring columns move at different speeds
//   [data-zoom]     image that eases from slightly enlarged to normal as it arrives
//   [data-slide]    block that slides in from the side ("left" | "right", default up) while fading in, tied to scroll
//   [data-mask]     frame that opens from a small rounded window to its full size as it scrolls into view
// Everything is transform/opacity only. Reduced-motion visitors get the plain, finished layout.
// `deps`: re-run when content that mounts late (after a loading spinner) appears.
export function useScrollMotion(deps = []) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return undefined;
      const restores = [];

      root.querySelectorAll('[data-split]').forEach((el) => {
        const text = el.textContent;
        const words = text.trim().split(/\s+/);
        el.setAttribute('aria-label', text);
        el.textContent = '';
        const inner = words.map((word, i) => {
          const mask = document.createElement('span');
          mask.setAttribute('aria-hidden', 'true');
          mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:0.12em;margin-bottom:-0.12em';
          const span = document.createElement('span');
          span.style.cssText = 'display:inline-block;will-change:transform';
          span.textContent = word;
          mask.appendChild(span);
          el.appendChild(mask);
          if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
          return span;
        });
        restores.push(() => {
          el.textContent = text;
          el.removeAttribute('aria-label');
        });
        gsap.fromTo(
          inner,
          { yPercent: 105, x: (i) => (i % 2 ? 36 : -36), opacity: 0 },
          {
            yPercent: 0,
            x: 0,
            opacity: 1,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 52%', scrub: 0.6 },
          }
        );
      });

      root.querySelectorAll('[data-slide]').forEach((el) => {
        const side = el.dataset.slide;
        const from = { opacity: 0, x: side === 'left' ? -90 : side === 'right' ? 90 : 0, y: side ? 24 : 70 };
        gsap.fromTo(
          el,
          from,
          { opacity: 1, x: 0, y: 0, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 62%', scrub: 0.7 } }
        );
      });

      root.querySelectorAll('[data-mask]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(16% 14% 16% 14% round 28px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 30%', scrub: 0.7 } }
        );
      });

      root.querySelectorAll('[data-drift]').forEach((el) => {
        const amount = parseFloat(el.dataset.drift) || 40;
        gsap.fromTo(
          el,
          { y: amount },
          { y: -amount, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }
        );
      });

      root.querySelectorAll('[data-zoom]').forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1.18 },
          { scale: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'center center', scrub: 0.8 } }
        );
      });

      return () => restores.forEach((undo) => undo());
    },
    { scope: ref, dependencies: deps }
  );

  return ref;
}
