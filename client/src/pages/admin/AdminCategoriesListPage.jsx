import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminCategories, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { toast } from '../../store/useToastStore';

function SortOrderInput({ category, onSave }) {
  const [value, setValue] = useState(category.sortOrder ?? 0);

  return (
    <input
      type="number"
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const n = Number(value);
        if (n !== category.sortOrder) onSave(n);
      }}
      className="w-16 border border-stone-300 bg-paper px-2 py-1 text-sm"
    />
  );
}

export default function AdminCategoriesListPage() {
  const { data: categories, isLoading } = useAdminCategories();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const navigate = useNavigate();

  const saveSortOrder = (category, sortOrder) => {
    updateCategory.mutate(
      { id: category._id, data: { sortOrder } },
      {
        onSuccess: () => toast.success('Sort order updated'),
        onError: () => toast.error('Could not update sort order'),
      }
    );
  };

  const handleDelete = (category) => {
    if (!window.confirm(`Deactivate "${category.name}"?`)) return;
    deleteCategory.mutate(category._id, {
      onSuccess: () => toast.success('Category deactivated'),
      onError: () => toast.error('Could not deactivate category'),
    });
  };

  const columns = [
    {
      key: 'image',
      header: '',
      className: 'w-14',
      render: (c) => (c.image ? <img src={c.image} alt="" className="h-10 w-10 object-cover" /> : null),
    },
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type', render: (c) => <Badge tone="neutral">{c.type}</Badge> },
    {
      key: 'sortOrder',
      header: 'Sort Order',
      render: (c) => <SortOrderInput category={c} onSave={(n) => saveSortOrder(c, n)} />,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (c) => <Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(c); }}
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
        <h1 className="font-display text-2xl">Categories</h1>
        <Button as={Link} to="/admin/categories/new">New Category</Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        onRowClick={(c) => navigate(`/admin/categories/${c._id}/edit`)}
        emptyMessage="No categories yet"
      />
    </div>
  );
}
