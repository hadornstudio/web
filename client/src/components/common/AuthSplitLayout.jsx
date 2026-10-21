import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import BrandVideo from './BrandVideo';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../../lib/motion/gsapConfig';

export default function AuthSplitLayout({ video, poster, loop = false, caption, imageSide = 'left', children }) {
  const revealRef = useRef(null);

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
        className={`relative h-56 overflow-hidden bg-night md:h-auto ${imageSide === 'right' ? 'md:order-2' : ''}`}
      >
        <BrandVideo src={video} poster={poster} loop={loop} delay={400}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-night/10" />
          {caption && (
            <div className="absolute bottom-6 left-6 right-6 text-ivory md:bottom-10 md:left-10">
              <p className="font-studio text-[11px] uppercase tracking-[0.3em] text-gold">{caption.label}</p>
              <p className="mt-2 font-display text-xl md:text-3xl">{caption.line}</p>
            </div>
          )}
        </BrandVideo>
      </div>

      <div className="flex items-center justify-center px-6 py-16 md:px-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
