import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../common/Button';

export default function CartSummary({ subtotal }) {
  return (
    <div className="border border-stone-300 p-6">
      <h2 className="font-display text-xl">Summary</h2>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-stone-600">Subtotal</span>
        <span className="text-ink">{formatCurrency(subtotal)}</span>
      </div>
      <p className="mt-2 text-xs text-stone-600">Shipping and any discounts are calculated at checkout.</p>
      <Button as={Link} to="/checkout" className="mt-6 w-full">
        Proceed to Checkout
      </Button>
    </div>
  );
}
