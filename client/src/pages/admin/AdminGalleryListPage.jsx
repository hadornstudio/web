import { Link, useNavigate } from 'react-router-dom';
import { useAdminGalleryItems, useDeleteGalleryItem } from '../../hooks/useGallery';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { toast } from '../../store/useToastStore';

export default function AdminGalleryListPage() {
  const { data: items, isLoading } = useAdminGalleryItems();
  const deleteItem = useDeleteGalleryItem();
  const navigate = useNavigate();

  const handleDelete = (item) => {
    if (!window.confirm(`Deactivate "${item.title}"?`)) return;
    deleteItem.mutate(item._id, {
      onSuccess: () => toast.success('Gallery item deactivated'),
      onError: () => toast.error('Could not deactivate item'),
    });
  };

  const columns = [
    {
      key: 'image',
      header: '',
      className: 'w-14',
      render: (i) => (i.images?.[0] ? <img src={i.images[0]} alt="" className="h-10 w-10 object-cover" /> : null),
    },
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category', render: (i) => i.category?.name || '—' },
    { key: 'product', header: 'Linked Product', render: (i) => i.product?.title || <span className="text-stone-600">Custom order</span> },
    { key: 'likesCount', header: 'Likes', render: (i) => i.likesCount || 0 },
    {
      key: 'isActive',
      header: 'Status',
      render: (i) => <Badge tone={i.isActive ? 'success' : 'neutral'}>{i.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (i) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
          className="text-xs text-stone-600 hover:text-error"
        >
          Deactivate
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">Gallery</h1>
        <Button as={Link} to="/admin/gallery/new">New Gallery Item</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        onRowClick={(i) => navigate(`/admin/gallery/${i._id}/edit`)}
        emptyMessage="No gallery items yet"
      />
    </div>
  );
}
