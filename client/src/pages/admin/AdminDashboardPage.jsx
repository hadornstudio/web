import { useNavigate } from 'react-router-dom';
import { useAnalyticsOverview } from '../../hooks/useAnalytics';
import { useCountUp } from '../../hooks/useCountUp';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import PriceTag from '../../components/common/PriceTag';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_TONE = {
  pending: 'neutral',
  paid: 'accent',
  processing: 'accent',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'error',
};

function StatCard({ label, value, format }) {
  const display = useCountUp(value);
  return (
    <div className="border border-stone-300 bg-paper p-5">
      <p className="text-xs uppercase tracking-wide text-stone-600">{label}</p>
      <p className="mt-2 font-display text-3xl">{format ? format(display) : display}</p>
    </div>
  );
}

function RevenueChart({ series }) {
  const max = Math.max(...series.map((d) => d.revenue), 1);

  return (
    <div className="flex h-40 items-end gap-1">
      {series.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${formatCurrency(d.revenue)} (${d.orderCount} orders)`}
          className="flex-1 bg-accent transition-opacity hover:opacity-70"
          style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 1)}%` }}
        />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAnalyticsOverview(30);
  const navigate = useNavigate();

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const { headline, revenueSeries, topProducts, recentOrders } = data;

  const orderColumns = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'customerName', header: 'Customer' },
    { key: 'total', header: 'Total', render: (o) => <PriceTag amount={o.total} /> },
    { key: 'status', header: 'Status', render: (o) => <Badge tone={STATUS_TONE[o.status] || 'neutral'}>{o.status}</Badge> },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Dashboard</h1>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard label="Revenue" value={headline.totalRevenue} format={formatCurrency} />
        <StatCard label="Orders" value={headline.totalOrders} />
        <StatCard label="Customers" value={headline.totalCustomers} />
        <StatCard label="Avg Order Value" value={headline.averageOrderValue} format={formatCurrency} />
      </div>

      <div className="mb-8 grid grid-cols-3 gap-8">
        <div className="col-span-2 border border-stone-300 p-5">
          <h2 className="mb-4 font-display text-lg">Revenue (Last 30 Days)</h2>
          <RevenueChart series={revenueSeries} />
        </div>

        <div className="border border-stone-300 p-5">
          <h2 className="mb-4 font-display text-lg">Top Products</h2>
          <div className="flex flex-col gap-3">
            {topProducts.length === 0 && <p className="text-sm text-stone-600">No sales yet.</p>}
            {topProducts.map((p) => (
              <div key={p.productId} className="flex items-center gap-3">
                <img src={p.image} alt="" className="h-10 w-10 shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.title}</p>
                  <p className="text-xs text-stone-600">{p.unitsSold} sold</p>
                </div>
                <PriceTag amount={p.revenue} className="shrink-0 text-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg">Recent Orders</h2>
        <DataTable
          columns={orderColumns}
          data={recentOrders}
          onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
          emptyMessage="No orders yet"
        />
      </div>
    </div>
  );
}
