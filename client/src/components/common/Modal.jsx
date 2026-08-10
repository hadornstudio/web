import { useEffect } from 'react';

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 text-2xl text-paper hover:text-accent-tint"
        aria-label="Close"
      >
        ×
      </button>
      <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-3xl">
        {children}
      </div>
    </div>
  );
}
