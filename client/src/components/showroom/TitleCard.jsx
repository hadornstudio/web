import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/motion/gsapConfig';
import BrandSvg from '../brand/BrandSvg';
import { SHOWROOM } from './showroomConfig';

// ~1.5 s opening card: a gold line draws across, the mark and "THE GALLERY" fade in.
export default function TitleCard({ onDone }) {
  const rootRef = useRef(null);
  const lineRef = useRef(null);
  const markRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ onComplete: onDone })
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' })
        .fromTo(markRef.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.35)
        .fromTo(titleRef.current, { autoAlpha: 0, letterSpacing: '0.7em' }, { autoAlpha: 1, letterSpacing: '0.4em', duration: 0.7, ease: 'power3.out' }, 0.5)
        .fromTo(subRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.9)
        .to(rootRef.current, { autoAlpha: 0, duration: 0.3 }, 1.5);
    }, rootRef);
    return () => ctx.revert();
  }, [onDone]);

  return (
    <div ref={rootRef} className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-night px-6 text-center text-gold">
      <div ref={lineRef} className="mb-8 h-px w-[min(280px,60vw)] origin-left bg-gold/80" />
      <BrandSvg ref={markRef} name="mark" className="mb-6 w-12" aria-hidden="true" />
      <h1 ref={titleRef} className="font-studio text-xl font-light uppercase text-gold md:text-3xl">{SHOWROOM.title}</h1>
      <p ref={subRef} className="mt-4 font-studio text-sm font-light text-ivory/70">{SHOWROOM.subline}</p>
    </div>
  );
}
