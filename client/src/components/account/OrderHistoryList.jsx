import { Link } from 'react-router-dom';
import { useMyOrders } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';

const STATUS_TONE = {
  pending: 'neutral',
  paid: 'accent',
  processing: 'accent',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrderHistoryList() {
  const { data, isLoading } = useMyOrders();
  const orders = data?.data?.orders || [];

  if (isLoading) return <Spinner />;
  if (!orders.length) {
    return <EmptyState title="No orders yet" description="Your order history will appear here once you check out." />;
  }

  return (
    <div className="flex flex-col divide-y divide-stone-300">
      {orders.map((order) => (
        <Link
          key={order._id}
          to={`/order-confirmation/${order._id}`}
          className="flex items-center justify-between gap-4 py-5 hover:bg-cream"
        >
          <div>
            <p className="text-sm text-ink">{order.orderNumber}</p>
            <p className="text-xs text-stone-600">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink">{formatCurrency(order.total)}</span>
            <Badge tone={STATUS_TONE[order.status] || 'neutral'}>{order.status}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
