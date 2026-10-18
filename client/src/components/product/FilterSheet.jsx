import { useEffect, useRef } from 'react';

// Phone-sized bottom sheet that holds the filter panel.
export default function FilterSheet({ open, onClose, total, onClear, hasFilters, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close filters"
        onClick={onClose}
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col bg-paper transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center justify-between border-b border-stone-300 px-6 py-4">
          <h2 className="font-display text-xl">Filters</h2>
          <button ref={closeRef} type="button" onClick={onClose} className="text-sm uppercase tracking-wide text-stone-600 hover:text-accent">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4">{children}</div>

        <div className="flex items-center gap-3 border-t border-stone-300 bg-paper px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="px-2 py-3 text-sm uppercase tracking-wide text-stone-600 hover:text-accent disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-accent px-6 py-3 text-sm uppercase tracking-wide text-paper hover:bg-accent-dark"
          >
            Show {total != null ? `${total} ` : ''}{total === 1 ? 'piece' : 'pieces'}
          </button>
        </div>
      </div>
    </div>
  );
}
