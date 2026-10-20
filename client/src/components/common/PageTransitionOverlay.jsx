import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import BrandSvg from '../brand/BrandSvg';

// Changing a category filter moves between /shop and /shop/:category — same page, so no flourish.
const inShop = (path) => path === '/shop' || path.startsWith('/shop/');

// The dark brown + gold look shared with the intro, splash and loading screen. Purely decorative — route content has already swapped in underneath by the time this
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
    const previous = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prefersReducedMotion() || (inShop(previous) && inShop(pathname))) return;

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
      className="pointer-events-none fixed inset-0 z-[999] flex items-center justify-center bg-night opacity-0"
      style={{ visibility: 'hidden' }}
    >
      <div ref={markRef} className="flex flex-col items-center gap-6 text-gold opacity-0">
        <BrandSvg name="mark" className="w-[clamp(72px,10vw,104px)]" />
        <BrandSvg name="studio" className="w-[clamp(180px,28vw,320px)]" />
      </div>
    </div>
  );
}
