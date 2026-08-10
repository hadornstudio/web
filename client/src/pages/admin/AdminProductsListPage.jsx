import { Link, useNavigate } from 'react-router-dom';
import { useAdminProducts, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import PriceTag from '../../components/common/PriceTag';
import { toast } from '../../store/useToastStore';

const STOCK_TONE = {
  in_stock: 'success',
  low_stock: 'accent',
  out_of_stock: 'error',
  made_to_order: 'neutral',
};

export default function AdminProductsListPage() {
  const { data: products, isLoading } = useAdminProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const navigate = useNavigate();

  const toggleFeatured = (product) => {
    updateProduct.mutate(
      { id: product._id, data: { isFeatured: !product.isFeatured } },
      {
        onSuccess: () => toast.success(product.isFeatured ? 'Removed from featured' : 'Added to featured'),
        onError: () => toast.error('Could not update product'),
      }
    );
  };

  const handleDelete = (product) => {
    if (!window.confirm(`Deactivate "${product.title}"? It will be hidden from the storefront.`)) return;
    deleteProduct.mutate(product._id, {
      onSuccess: () => toast.success('Product deactivated'),
      onError: () => toast.error('Could not deactivate product'),
    });
  };

  const columns = [
    {
      key: 'image',
      header: '',
      className: 'w-14',
      render: (p) => <img src={p.images?.[0]} alt="" className="h-10 w-10 object-cover" />,
    },
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category', render: (p) => p.category?.name || '—' },
    { key: 'price', header: 'Price', render: (p) => <PriceTag amount={p.basePrice} /> },
    {
      key: 'stockStatus',
      header: 'Stock',
      render: (p) => <Badge tone={STOCK_TONE[p.stockStatus] || 'neutral'}>{p.stockStatus.replace('_', ' ')}</Badge>,
    },
    {
      key: 'isFeatured',
      header: 'Featured',
      render: (p) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFeatured(p); }}
          className={`px-2 py-1 text-xs uppercase tracking-wide ${p.isFeatured ? 'bg-accent-tint text-accent-dark' : 'bg-stone-100 text-stone-600'}`}
        >
          {p.isFeatured ? 'Featured' : 'Off'}
        </button>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (p) => <Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
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
        <h1 className="font-display text-2xl">Products</h1>
        <Button as={Link} to="/admin/products/new">New Product</Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onRowClick={(p) => navigate(`/admin/products/${p._id}/edit`)}
        emptyMessage="No products yet"
      />
    </div>
  );
}
