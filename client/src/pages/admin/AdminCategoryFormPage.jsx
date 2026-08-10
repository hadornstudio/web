import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminCategory, useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { toast } from '../../store/useToastStore';

const TYPES = ['necklaces', 'bracelets', 'earrings', 'anklets', 'custom'];

const EMPTY_FORM = { name: '', type: '', description: '', image: '', sortOrder: 0, isActive: true };

function toFormState(category) {
  return {
    name: category.name || '',
    type: category.type || '',
    description: category.description || '',
    image: category.image || '',
    sortOrder: category.sortOrder ?? 0,
    isActive: category.isActive ?? true,
  };
}

export default function AdminCategoryFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { category, isLoading } = useAdminCategory(id);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && category) setForm(toFormState(category));
  }, [isEdit, category]);

  if (isEdit && isLoading) return <Spinner />;
  if (isEdit && !isLoading && !category) return <p>Category not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      type: form.type,
      description: form.description,
      image: form.image,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    const mutation = isEdit ? updateCategory : createCategory;
    const mutationArgs = isEdit ? { id, data: payload } : payload;

    mutation.mutate(mutationArgs, {
      onSuccess: () => {
        toast.success(isEdit ? 'Category updated' : 'Category created');
        navigate('/admin/categories');
      },
      onError: (err) => {
        setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      },
    });
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl">{isEdit ? 'Edit Category' : 'New Category'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} />

        <Select label="Type" required value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option value="">Select a type…</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">Description</span>
          <textarea
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
          />
        </label>

        <ImageUploadField label="Image" value={form.image} onChange={(v) => set('image', v)} />

        <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Category'}</Button>
          <button type="button" onClick={() => navigate('/admin/categories')} className="text-sm text-stone-600 hover:text-accent">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
