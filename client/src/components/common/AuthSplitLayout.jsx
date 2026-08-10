import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useParallax } from '../../hooks/useParallax';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../../lib/motion/gsapConfig';

export default function AuthSplitLayout({ image, imageSide = 'left', children }) {
  const revealRef = useRef(null);
  const imageRef = useParallax({ amount: 40 });

  useGSAP(
    () => {
      if (!revealRef.current) return;
      if (prefersReducedMotion()) {
        gsap.set(revealRef.current, { autoAlpha: 1, scale: 1 });
        return;
      }
      gsap.fromTo(
        revealRef.current,
        { autoAlpha: 0, scale: 1.06 },
        { autoAlpha: 1, scale: 1, duration: DURATION.slow, ease: EASE.reveal }
      );
    },
    { scope: revealRef }
  );

  return (
    <div className="grid min-h-[calc(100vh-81px)] grid-cols-1 md:grid-cols-2">
      <div
        ref={revealRef}
        className={`relative h-56 overflow-hidden bg-cream md:h-auto ${imageSide === 'right' ? 'md:order-2' : ''}`}
      >
        <img
          ref={imageRef}
          src={image}
          alt=""
          className="absolute -top-[12%] left-0 h-[124%] w-full object-cover"
        />
      </div>

      <div className="flex items-center justify-center px-6 py-16 md:px-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
