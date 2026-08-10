import { Link, useNavigate } from 'react-router-dom';
import { useAdminAds, useDeleteAd } from '../../hooks/useAds';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { toast } from '../../store/useToastStore';

const PLACEMENT_LABELS = {
  'homepage-banner': 'Homepage Banner',
  'shop-banner': 'Shop Banner',
  'gallery-banner': 'Gallery Banner',
};

export default function AdminAdsListPage() {
  const { data: ads, isLoading } = useAdminAds();
  const deleteAd = useDeleteAd();
  const navigate = useNavigate();

  const handleDelete = (ad) => {
    if (!window.confirm(`Deactivate ad "${ad.title}"?`)) return;
    deleteAd.mutate(ad._id, {
      onSuccess: () => toast.success('Ad deactivated'),
      onError: () => toast.error('Could not deactivate ad'),
    });
  };

  const columns = [
    {
      key: 'preview', header: '', render: (a) => (
        a.mediaType === 'video'
          ? <video src={a.mediaUrl} className="h-12 w-16 object-cover" muted />
          : <img src={a.mediaUrl} alt="" className="h-12 w-16 object-cover" />
      ),
    },
    { key: 'title', header: 'Title' },
    { key: 'placement', header: 'Placement', render: (a) => PLACEMENT_LABELS[a.placement] || a.placement },
    { key: 'linkType', header: 'Links To', render: (a) => (
      a.linkType === 'promo' ? `Promo: ${a.promo?.title || '—'}`
      : a.linkType === 'product' ? `Product: ${a.product?.title || '—'}`
      : a.linkType === 'category' ? `Category: ${a.category?.name || '—'}`
      : a.linkType === 'url' ? 'External URL'
      : 'Not linked'
    ) },
    { key: 'isActive', header: 'Status', render: (a) => <Badge tone={a.isActive ? 'success' : 'neutral'}>{a.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(a); }} className="text-xs text-stone-600 hover:text-error">
          Deactivate
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Ad Campaigns</h1>
        <Button as={Link} to="/admin/ads/new">New Ad</Button>
      </div>

      <DataTable
        columns={columns}
        data={ads}
        isLoading={isLoading}
        onRowClick={(a) => navigate(`/admin/ads/${a._id}/edit`)}
        emptyMessage="No ad campaigns yet"
      />
    </div>
  );
}
