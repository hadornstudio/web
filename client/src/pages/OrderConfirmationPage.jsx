import { useParams, Link } from 'react-router-dom';
import { useMyOrder } from '../hooks/useOrders';
import { formatCurrency } from '../utils/formatCurrency';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { data, isLoading } = useMyOrder(orderId);
  const order = data?.data?.order;

  if (isLoading) return <Spinner className="py-32" />;
  if (!order) return <div className="container-page py-32 text-center">Order not found.</div>;

  return (
    <div className="container-page flex justify-center py-24">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs uppercase tracking-wide text-success">Payment Confirmed</p>
        <h1 className="mt-3 font-display text-4xl">Thank You</h1>
        <p className="mt-3 text-stone-600">
          Your order <span className="text-ink">{order.orderNumber}</span> has been placed. A confirmation has been recorded to your account.
        </p>

        <div className="mt-10 border border-stone-300 p-6 text-left">
          <div className="flex flex-col gap-3 divide-y divide-stone-300">
            {order.items.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm ${i > 0 ? 'pt-3' : ''}`}>
                <img src={item.image} alt={item.title} className="h-14 w-14 object-cover" />
                <div className="flex-1">
                  <p className="text-ink">{item.title}</p>
                  <p className="text-stone-600">{item.variantLabel} · Qty {item.quantity}</p>
                </div>
                <span>{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-stone-300 pt-4 text-sm">
            <div className="flex justify-between py-1"><span className="text-stone-600">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between py-1 text-accent"><span>Discount</span><span>−{formatCurrency(order.discountTotal)}</span></div>
            )}
            <div className="flex justify-between py-1"><span className="text-stone-600">Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</span></div>
            <div className="flex justify-between py-1"><span className="text-stone-600">Tax</span><span>{formatCurrency(order.tax)}</span></div>
            <div className="mt-2 flex justify-between border-t border-stone-300 pt-2 text-base text-ink">
              <span>Total</span><span className="font-medium">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <Button as={Link} to="/account/orders" variant="secondary">View Order History</Button>
          <Button as={Link} to="/shop">Continue Shopping</Button>
        </div>
      </div>
    </div>
  );
}
