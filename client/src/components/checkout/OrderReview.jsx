import { formatCurrency } from '../../utils/formatCurrency';
import CouponInput from './CouponInput';

export default function OrderReview({ items, address, subtotal, totals, coupon, onApplyCoupon, onRemoveCoupon, onBack, onContinue }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-wide text-ink">Shipping To</h3>
          <button type="button" onClick={onBack} className="text-xs text-accent hover:text-accent-dark">Edit</button>
        </div>
        <p className="text-sm text-stone-600">
          {address.fullName} · {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}, {address.postalCode}, {address.country}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm uppercase tracking-wide text-ink">Items</h3>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 text-sm">
              <img src={item.image} alt={item.title} className="h-14 w-14 shrink-0 object-cover" />
              <div className="flex-1">
                <p className="text-ink">{item.title}</p>
                <p className="text-stone-600">{item.variantLabel} · Qty {item.quantity}</p>
              </div>
              <span className="text-ink">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm uppercase tracking-wide text-ink">Coupon</h3>
        <CouponInput subtotal={subtotal} items={items} applied={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} />
      </div>

      <div className="border-t border-stone-300 pt-4 text-sm">
        <div className="flex justify-between py-1"><span className="text-stone-600">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {totals.discountTotal > 0 && (
          <div className="flex justify-between py-1 text-accent"><span>Discount</span><span>−{formatCurrency(totals.discountTotal)}</span></div>
        )}
        <div className="flex justify-between py-1"><span className="text-stone-600">Shipping</span><span>{totals.shippingCost === 0 ? 'Free' : formatCurrency(totals.shippingCost)}</span></div>
        <div className="flex justify-between py-1"><span className="text-stone-600">Tax (VAT)</span><span>{formatCurrency(totals.tax)}</span></div>
        <div className="mt-2 flex justify-between border-t border-stone-300 pt-2 text-base text-ink">
          <span>Total</span><span className="font-medium">{formatCurrency(totals.total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="bg-accent px-6 py-3 text-sm uppercase tracking-wide text-paper hover:bg-accent-dark"
      >
        Continue to Payment
      </button>
    </div>
  );
}
