import { Link, useNavigate } from 'react-router-dom';
import { useAdminCoupons, useDeleteCoupon } from '../../hooks/useCoupons';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from '../../store/useToastStore';

export default function AdminCouponsListPage() {
  const { data: coupons, isLoading } = useAdminCoupons();
  const deleteCoupon = useDeleteCoupon();
  const navigate = useNavigate();

  const handleDelete = (coupon) => {
    if (!window.confirm(`Deactivate coupon "${coupon.code}"?`)) return;
    deleteCoupon.mutate(coupon._id, {
      onSuccess: () => toast.success('Coupon deactivated'),
      onError: () => toast.error('Could not deactivate coupon'),
    });
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'type', header: 'Type' },
    { key: 'value', header: 'Value', render: (c) => (c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value)) },
    { key: 'usage', header: 'Usage', render: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
    { key: 'expiresAt', header: 'Expires', render: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—') },
    { key: 'isActive', header: 'Status', render: (c) => <Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(c); }} className="text-xs text-stone-600 hover:text-error">
          Deactivate
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Coupons</h1>
        <Button as={Link} to="/admin/coupons/new">New Coupon</Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={isLoading}
        onRowClick={(c) => navigate(`/admin/coupons/${c._id}/edit`)}
        emptyMessage="No coupons yet"
      />
    </div>
  );
}
