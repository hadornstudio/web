import { useEffect, useRef, useState } from 'react';
import { useToastStore } from '../../store/useToastStore';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';

const TONE_STYLES = {
  success: 'border-success text-success',
  error: 'border-error text-error',
};

function Toast({ id, message, tone, onDone }) {
  const ref = useRef(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (prefersReducedMotion()) {
      gsap.set(ref.current, { autoAlpha: 1, y: 0 });
    } else {
      gsap.fromTo(ref.current, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: DURATION.fast, ease: EASE.hover });
    }
    const timer = setTimeout(() => setLeaving(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving || !ref.current) return;
    if (prefersReducedMotion()) {
      onDone();
      return;
    }
    gsap.fromTo(
      ref.current,
      { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: -12, duration: DURATION.fast, ease: EASE.hover, onComplete: onDone }
    );
  }, [leaving]);

  return (
    <div
      ref={ref}
      onClick={() => setLeaving(true)}
      className={`cursor-pointer border bg-paper px-4 py-3 text-sm shadow-md ${TONE_STYLES[tone] || TONE_STYLES.success}`}
    >
      {message}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-6 top-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDone={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
