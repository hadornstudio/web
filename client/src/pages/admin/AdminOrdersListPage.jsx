import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminOrders } from '../../hooks/useOrders';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import PriceTag from '../../components/common/PriceTag';
import Select from '../../components/common/Select';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_TONE = {
  pending: 'neutral',
  paid: 'accent',
  processing: 'accent',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'error',
};

export default function AdminOrdersListPage() {
  const [status, setStatus] = useState('');
  const { data: orders, isLoading } = useAdminOrders(status ? { status } : undefined);
  const navigate = useNavigate();

  const columns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customer', header: 'Customer', render: (o) => o.user?.name || 'Unknown' },
    { key: 'total', header: 'Total', render: (o) => <PriceTag amount={o.total} /> },
    { key: 'status', header: 'Status', render: (o) => <Badge tone={STATUS_TONE[o.status] || 'neutral'}>{o.status}</Badge> },
    { key: 'date', header: 'Date', render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Orders</h1>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto max-w-[180px]">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
        emptyMessage="No orders yet"
      />
    </div>
  );
}
