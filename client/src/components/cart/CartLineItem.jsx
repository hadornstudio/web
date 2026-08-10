import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCartStore } from '../../store/useCartStore';
import { gsap, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';

export default function CartLineItem({ item, compact = false }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const qtyRef = useRef(null);

  useGSAP(
    () => {
      if (!qtyRef.current || prefersReducedMotion()) return;
      gsap.fromTo(qtyRef.current, { scale: 1.35 }, { scale: 1, duration: 0.3, ease: EASE.hover });
    },
    { dependencies: [item.quantity], scope: qtyRef }
  );

  return (
    <div className={`flex gap-4 ${compact ? 'py-4' : 'py-6'}`}>
      <Link to={`/product/${item.slug}`} className={`shrink-0 overflow-hidden bg-cream ${compact ? 'h-20 w-20' : 'h-28 w-28'}`}>
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/product/${item.slug}`} className="text-sm text-ink hover:text-accent">
              {item.title}
            </Link>
            {item.variantLabel && <p className="mt-0.5 text-xs text-stone-600">{item.variantLabel}</p>}
          </div>
          <span className="text-sm text-ink">{formatCurrency(item.unitPrice * item.quantity)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-stone-300">
            <button
              type="button"
              className="px-2.5 py-1 text-stone-600 hover:text-accent"
              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span ref={qtyRef} className="inline-block w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="px-2.5 py-1 text-stone-600 hover:text-accent"
              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="text-xs uppercase tracking-wide text-stone-600 hover:text-error"
            onClick={() => removeItem(item.productId, item.variantId)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
