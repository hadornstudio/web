import { useAdminGalleryLikes } from '../../hooks/useGallery';
import DataTable from '../../components/admin/DataTable';

export default function AdminGalleryLikesPage() {
  const { data: likes, isLoading } = useAdminGalleryLikes();

  const columns = [
    {
      key: 'image',
      header: '',
      className: 'w-14',
      render: (l) => (l.galleryItem?.images?.[0] ? (
        <img src={l.galleryItem.images[0]} alt="" className="h-10 w-10 object-cover" />
      ) : null),
    },
    { key: 'item', header: 'Liked Piece', render: (l) => l.galleryItem?.title || '(removed)' },
    { key: 'name', header: 'Customer', render: (l) => l.user?.name },
    {
      key: 'email',
      header: 'Email',
      render: (l) => (
        <a href={`mailto:${l.user?.email}`} className="text-accent hover:text-accent-dark" onClick={(e) => e.stopPropagation()}>
          {l.user?.email}
        </a>
      ),
    },
    { key: 'phone', header: 'Phone', render: (l) => l.user?.phone || '—' },
    { key: 'date', header: 'Liked', render: (l) => new Date(l.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Interested Customers</h1>
        <p className="mt-1 text-sm text-stone-600">
          Everyone who's liked a piece in the gallery, newest first — a ready-made follow-up list.
        </p>
      </div>

      <DataTable columns={columns} data={likes} isLoading={isLoading} emptyMessage="No likes yet" />
    </div>
  );
}
