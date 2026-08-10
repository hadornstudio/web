import { Link, useNavigate } from 'react-router-dom';
import { useAdminPromos, useDeletePromo, useAnnouncePromo } from '../../hooks/usePromos';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { toast } from '../../store/useToastStore';

export default function AdminPromosListPage() {
  const { data: promos, isLoading } = useAdminPromos();
  const deletePromo = useDeletePromo();
  const announcePromo = useAnnouncePromo();
  const navigate = useNavigate();

  const handleDelete = (promo) => {
    if (!window.confirm(`Deactivate promo "${promo.title}"?`)) return;
    deletePromo.mutate(promo._id, {
      onSuccess: () => toast.success('Promo deactivated'),
      onError: () => toast.error('Could not deactivate promo'),
    });
  };

  const handleAnnounce = (promo) => {
    if (!window.confirm(`Email every customer about "${promo.title}"?`)) return;
    announcePromo.mutate(promo._id, {
      onSuccess: (res) => toast.success(res.message || 'Announcement sent'),
      onError: () => toast.error('Could not send announcement'),
    });
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'coupon', header: 'Coupon', render: (p) => p.coupon?.code || '—' },
    { key: 'window', header: 'Window', render: (p) => (
      p.startsAt || p.endsAt
        ? `${p.startsAt ? new Date(p.startsAt).toLocaleDateString() : '…'} – ${p.endsAt ? new Date(p.endsAt).toLocaleDateString() : '…'}`
        : 'Always on'
    ) },
    { key: 'isActive', header: 'Status', render: (p) => <Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'announcedAt', header: 'Announced', render: (p) => (p.announcedAt ? new Date(p.announcedAt).toLocaleString() : 'Not yet') },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => handleAnnounce(p)} disabled={announcePromo.isPending} className="text-xs text-accent hover:text-accent-dark">
            {p.announcedAt ? 'Re-announce' : 'Announce'}
          </button>
          <button type="button" onClick={() => handleDelete(p)} className="text-xs text-stone-600 hover:text-error">
            Deactivate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Promos</h1>
        <Button as={Link} to="/admin/promos/new">New Promo</Button>
      </div>

      <DataTable
        columns={columns}
        data={promos}
        isLoading={isLoading}
        onRowClick={(p) => navigate(`/admin/promos/${p._id}/edit`)}
        emptyMessage="No promos yet"
      />
    </div>
  );
}
