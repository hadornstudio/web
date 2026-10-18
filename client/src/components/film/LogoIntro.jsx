import { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import { startLenis } from '../../lib/lenisManager';
import BrandSvg from '../brand/BrandSvg';

const SEEN_KEY = 'hadorn-intro-seen';

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // storage unavailable (private mode etc.) — the intro just replays next visit
  }
}

// Where each piece of the mark starts (SVG user units): apart and rotated, like beads before stringing.
const MARK_FROM = {
  'mark-main': { x: 0, y: 440, rotation: -10 },
  'mark-left': { x: -600, y: 160, rotation: -28 },
  'mark-top-right': { x: 540, y: -440, rotation: 32 },
  'mark-bottom': { x: -180, y: 540, rotation: 18 },
};

export default function LogoIntro() {
  const [active, setActive] = useState(() => !prefersReducedMotion() && !alreadySeen());
  const rootRef = useRef(null);
  const markRef = useRef(null);
  const wordRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    const lenis = startLenis();
    lenis?.stop();
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const release = () => {
      html.style.overflow = previousOverflow;
      lenis?.start();
    };

    const ctx = gsap.context(() => {
      const markPaths = [...markRef.current.querySelectorAll('path')];
      const letters = [...wordRef.current.querySelectorAll('path[id]')];
      const hadornLetters = letters.filter((p) => !p.id.startsWith('studio-'));
      const studioLetters = letters.filter((p) => p.id.startsWith('studio-'));
      const unit = 1607 / wordRef.current.clientWidth; // SVG units per screen px

      tlRef.current = gsap
        .timeline({
          onComplete: () => {
            markSeen();
            release();
            setActive(false);
          },
        })
        .fromTo(
          markPaths,
          { opacity: 0, x: (_, el) => MARK_FROM[el.id].x, y: (_, el) => MARK_FROM[el.id].y, rotation: (_, el) => MARK_FROM[el.id].rotation },
          { opacity: 1, x: 0, y: 0, rotation: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07 },
          0
        )
        // a single light sweep across the finished mark
        .to(markPaths, { fill: '#f3dca0', duration: 0.18, stagger: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.95)
        .fromTo(hadornLetters, { opacity: 0, y: 12 * unit }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, 0.85)
        .fromTo(
          studioLetters,
          { opacity: 0, x: (i) => (i - (studioLetters.length - 1) / 2) * 60 },
          { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
          1.35
        )
        .to([markRef.current, wordRef.current], { opacity: 0, duration: 0.25, ease: 'power1.in' }, 2.0)
        .addLabel('wipe', 2.15)
        .to(leftRef.current, { xPercent: -100, duration: 0.65, ease: 'power3.inOut' }, 'wipe')
        .to(rightRef.current, { xPercent: 100, duration: 0.65, ease: 'power3.inOut' }, 'wipe');
    }, rootRef);

    return () => {
      ctx.revert();
      release();
    };
  }, [active]);

  if (!active) return null;

  const skip = () => tlRef.current?.timeScale(5);

  return (
    <div ref={rootRef} onClick={skip} className="fixed inset-0 z-[100] cursor-pointer text-gold" role="presentation">
      <div ref={leftRef} className="absolute inset-y-0 left-0 w-1/2 bg-night" />
      <div ref={rightRef} className="absolute inset-y-0 right-0 w-1/2 bg-night" />
      <div className="relative flex h-full flex-col items-center justify-center gap-7" aria-hidden="true">
        <BrandSvg ref={markRef} name="mark" className="w-[clamp(96px,14vw,150px)]" />
        <BrandSvg ref={wordRef} name="studio" className="w-[clamp(230px,36vw,440px)]" />
      </div>
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-studio text-[11px] uppercase tracking-[0.35em] text-ivory/60 transition-colors hover:text-ivory"
      >
        Skip
      </button>
    </div>
  );
}
