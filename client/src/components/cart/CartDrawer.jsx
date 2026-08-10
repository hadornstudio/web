import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useCartStore } from '../../store/useCartStore';
import { formatCurrency } from '../../utils/formatCurrency';
import CartLineItem from './CartLineItem';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { gsap, Flip, EASE, DURATION, prefersReducedMotion } from '../../lib/motion/gsapConfig';

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());

  const [shouldRender, setShouldRender] = useState(isOpen);
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const listRef = useRef(null);
  const prevFlipState = useRef(null);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  // Open/close slide + fade — kept mounted briefly after close so the exit can play,
  // rather than the previous instant show/hide.
  useGSAP(
    () => {
      if (!shouldRender || !panelRef.current || !backdropRef.current) return;

      if (prefersReducedMotion()) {
        gsap.set(panelRef.current, { x: isOpen ? '0%' : '100%' });
        gsap.set(backdropRef.current, { autoAlpha: isOpen ? 1 : 0 });
        if (!isOpen) setShouldRender(false);
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          if (!isOpen) setShouldRender(false);
        },
      });

      if (isOpen) {
        tl.set(panelRef.current, { x: '100%' })
          .set(backdropRef.current, { autoAlpha: 0 })
          .to(backdropRef.current, { autoAlpha: 1, duration: DURATION.fast, ease: EASE.hover }, 0)
          .to(panelRef.current, { x: '0%', duration: DURATION.fast, ease: EASE.hover }, 0);
      } else {
        tl.to(panelRef.current, { x: '100%', duration: DURATION.fast, ease: EASE.hover }, 0)
          .to(backdropRef.current, { autoAlpha: 0, duration: DURATION.fast, ease: EASE.hover }, 0);
      }
    },
    { dependencies: [isOpen, shouldRender], scope: rootRef }
  );

  // Flip-animated reordering: remaining items slide to fill the gap on remove,
  // new items get a brief accent-tint highlight flash rather than popping in flatly.
  useGSAP(
    () => {
      if (!listRef.current) return;

      if (prevFlipState.current && !prefersReducedMotion()) {
        Flip.from(prevFlipState.current, {
          duration: DURATION.base,
          ease: EASE.reveal,
          absolute: true,
          onEnter: (elements) =>
            gsap
              .timeline()
              .fromTo(elements, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.fast })
              .fromTo(elements, { backgroundColor: 'var(--color-accent-tint)' }, { backgroundColor: 'transparent', duration: DURATION.base }, 0),
        });
      }
      prevFlipState.current = Flip.getState(listRef.current.children);
    },
    { dependencies: [items.length], scope: listRef }
  );

  if (!shouldRender) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-50">
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={closeDrawer}
        aria-label="Close cart"
      />
      <div ref={panelRef} className="relative ml-auto flex h-full w-full max-w-md flex-col bg-paper p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-300 pb-4">
          <h2 className="font-display text-xl">Your Bag</h2>
          <button type="button" onClick={closeDrawer} className="text-sm uppercase tracking-wide text-stone-600 hover:text-ink">
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Your bag is empty"
            description="Browse the collection to find something for you."
            action={
              <Button as={Link} to="/shop" onClick={closeDrawer}>
                Shop the Collection
              </Button>
            }
          />
        ) : (
          <>
            <div ref={listRef} className="flex-1 divide-y divide-stone-300 overflow-y-auto">
              {items.map((item) => (
                <CartLineItem key={`${item.productId}-${item.variantId}`} item={item} compact />
              ))}
            </div>

            <div className="border-t border-stone-300 pt-4">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-stone-600">Subtotal</span>
                <span className="text-ink">{formatCurrency(subtotal)}</span>
              </div>
              <Button as={Link} to="/cart" onClick={closeDrawer} className="w-full">
                View Bag
              </Button>
              <Button as={Link} to="/checkout" onClick={closeDrawer} variant="secondary" className="mt-3 w-full">
                Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
