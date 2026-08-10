import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';

// Purely decorative — route content has already swapped in underneath by the time this
// runs (no data-loading gate), so the timeline just gives the swap a branded flourish
// instead of masking a real async wait.
export default function PageTransitionOverlay() {
  const { pathname } = useLocation();
  const overlayRef = useRef(null);
  const markRef = useRef(null);
  // Compare against the previous pathname rather than a first-mount boolean flag —
  // React 19 StrictMode double-invokes effects on mount in dev, which would flip a
  // boolean flag and fire the animation spuriously on initial load with no real navigation.
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;
    if (prefersReducedMotion()) return;

    const overlay = overlayRef.current;
    const mark = markRef.current;

    const tl = gsap.timeline({
      onStart: () => gsap.set(overlay, { pointerEvents: 'auto' }),
      onComplete: () => gsap.set(overlay, { pointerEvents: 'none' }),
    });

    tl.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.fast, ease: EASE.reveal })
      .fromTo(mark, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: DURATION.fast, ease: EASE.reveal }, '<0.05')
      .to(mark, { autoAlpha: 0, duration: DURATION.fast, ease: EASE.hover }, '+=0.2')
      .to(overlay, { autoAlpha: 0, duration: DURATION.base, ease: EASE.reveal }, '<');

    return () => tl.kill();
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center bg-paper opacity-0"
      style={{ visibility: 'hidden' }}
    >
      <div ref={markRef} className="flex items-center gap-2.5 opacity-0">
        <img src="/logo-mark.png" alt="" className="h-10 w-10" />
        <span className="font-display text-2xl tracking-wide text-ink">HADORN</span>
      </div>
    </div>
  );
}
