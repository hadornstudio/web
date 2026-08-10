import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminGalleryItem, useCreateGalleryItem, useUpdateGalleryItem } from '../../hooks/useGallery';
import { useCategories } from '../../hooks/useCategories';
import { useAdminProducts } from '../../hooks/useProducts';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { toast } from '../../store/useToastStore';

const EMPTY_FORM = { title: '', description: '', images: [], category: '', product: '', sortOrder: 0, isActive: true };

function toFormState(item) {
  return {
    title: item.title || '',
    description: item.description || '',
    images: item.images || [],
    category: item.category?._id || '',
    product: item.product?._id || '',
    sortOrder: item.sortOrder ?? 0,
    isActive: item.isActive ?? true,
  };
}

export default function AdminGalleryFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { item, isLoading } = useAdminGalleryItem(id);
  const createItem = useCreateGalleryItem();
  const updateItem = useUpdateGalleryItem();
  const { data: categoriesData } = useCategories();
  const { data: products } = useAdminProducts();
  const categories = categoriesData?.data?.categories || [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && item) setForm(toFormState(item));
  }, [isEdit, item]);

  if (isEdit && isLoading) return <Spinner />;
  if (isEdit && !isLoading && !item) return <p>Gallery item not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      title: form.title,
      description: form.description,
      images: form.images,
      category: form.category,
      product: form.product,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    const mutation = isEdit ? updateItem : createItem;
    const mutationArgs = isEdit ? { id, data: payload } : payload;

    mutation.mutate(mutationArgs, {
      onSuccess: () => {
        toast.success(isEdit ? 'Gallery item updated' : 'Gallery item created');
        navigate('/admin/gallery');
      },
      onError: (err) => {
        setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      },
    });
  };

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl">{isEdit ? 'Edit Gallery Item' : 'New Gallery Item'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" required value={form.title} onChange={(e) => set('title', e.target.value)} />

        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">Description</span>
          <textarea
            rows={3}
            maxLength={1000}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
          />
        </label>

        <ImageUploadField multiple label="Images" value={form.images} onChange={(v) => set('images', v)} />

        <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </Select>

        <div>
          <Select label="Linked Product (optional)" value={form.product} onChange={(e) => set('product', e.target.value)}>
            <option value="">Not linked — custom/one-off piece</option>
            {products?.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-stone-600">
            If this piece is also sold in the shop, link it — "Order This" on the gallery will send customers
            straight to that product. Leave unlinked for one-off/bespoke work — "Order This" will open a
            custom-order inquiry with this image attached instead.
          </p>
        </div>

        <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Gallery Item'}</Button>
          <button type="button" onClick={() => navigate('/admin/gallery')} className="text-sm text-stone-600 hover:text-accent">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
