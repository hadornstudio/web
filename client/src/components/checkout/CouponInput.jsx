import { useState } from 'react';
import { couponsApi } from '../../api/coupons';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CouponInput({ subtotal, items, applied, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const lineItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      const res = await couponsApi.validate(code, subtotal, lineItems);
      onApply(res.data);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between border border-accent bg-accent-tint px-4 py-2.5 text-sm">
        <span className="text-accent-dark">
          {applied.code} applied — −{formatCurrency(applied.discountAmount)}
        </span>
        <button type="button" onClick={onRemove} className="text-xs uppercase text-stone-600 hover:text-error">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 border border-stone-300 bg-paper px-4 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!code || loading}
          className="border border-ink px-4 py-2 text-sm uppercase tracking-wide text-ink hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          Apply
        </button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </form>
  );
}
