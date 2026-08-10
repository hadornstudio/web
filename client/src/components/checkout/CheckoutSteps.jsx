import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, EASE, DURATION, prefersReducedMotion } from '../../lib/motion/gsapConfig';

const STEPS = ['Shipping', 'Review', 'Payment'];

export default function CheckoutSteps({ current }) {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      if (!containerRef.current || prefersReducedMotion()) return;
      const activeBadge = containerRef.current.querySelector(`[data-step="${current}"]`);
      if (activeBadge) {
        gsap.fromTo(activeBadge, { scale: 0.75 }, { scale: 1, duration: DURATION.fast, ease: EASE.hover });
      }
    },
    { dependencies: [current], scope: containerRef }
  );

  return (
    <div ref={containerRef} className="mb-12 flex items-center gap-4">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              data-step={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors duration-300 ${
                i < current ? 'bg-success text-paper' : i === current ? 'bg-accent text-paper' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className={`text-sm uppercase tracking-wide transition-colors duration-300 ${i <= current ? 'text-ink' : 'text-stone-600'}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className={`h-px w-8 transition-colors duration-300 ${i < current ? 'bg-success' : 'bg-stone-300'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
