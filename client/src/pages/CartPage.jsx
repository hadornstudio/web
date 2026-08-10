import { Link } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import CartLineItem from '../components/cart/CartLineItem';
import CartSummary from '../components/cart/CartSummary';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());

  if (items.length === 0) {
    return (
      <div className="container-page py-24">
        <EmptyState
          title="Your bag is empty"
          description="Browse the collection to find something for you."
          action={<Button as={Link} to="/shop">Shop the Collection</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-16">
      <h1 className="font-display text-4xl">Your Bag</h1>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="divide-y divide-stone-300 lg:col-span-2">
          {items.map((item) => (
            <CartLineItem key={`${item.productId}-${item.variantId}`} item={item} />
          ))}
        </div>

        <div>
          <CartSummary subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
