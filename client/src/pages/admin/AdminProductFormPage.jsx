import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useAdminCategories } from '../../hooks/useCategories';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { toast } from '../../store/useToastStore';

const EMPTY_VARIANT = { sku: '', color: '', size: '', material: '', priceDelta: 0, stock: 0 };

const EMPTY_FORM = {
  title: '',
  description: '',
  shortDescription: '',
  category: '',
  images: [],
  basePrice: '',
  stock: '',
  weight: '',
  materials: '',
  colors: '',
  tags: '',
  variants: [],
  isFeatured: false,
  isActive: true,
};

function toFormState(product) {
  return {
    title: product.title || '',
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    category: product.category?._id || product.category || '',
    images: product.images || [],
    basePrice: product.basePrice ?? '',
    stock: product.stock ?? '',
    weight: product.weight ?? '',
    materials: (product.materials || []).join(', '),
    colors: (product.colors || []).join(', '),
    tags: (product.tags || []).join(', '),
    variants: (product.variants || []).map((v) => ({
      sku: v.sku || '',
      color: v.color || '',
      size: v.size || '',
      material: v.material || '',
      priceDelta: v.priceDelta ?? 0,
      stock: v.stock ?? 0,
    })),
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive ?? true,
  };
}

function splitTags(value) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { product, isLoading: loadingProduct } = useAdminProduct(id);
  const { data: categories } = useAdminCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && product) setForm(toFormState(product));
  }, [isEdit, product]);

  if (isEdit && loadingProduct) return <Spinner />;
  if (isEdit && !loadingProduct && !product) return <p>Product not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateVariant = (idx, key, value) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === idx ? { ...v, [key]: value } : v)),
    }));
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }));
  const removeVariant = (idx) => setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.images.length === 0) {
      setError('At least one image is required.');
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      category: form.category,
      images: form.images,
      basePrice: Number(form.basePrice),
      stock: form.stock === '' ? 0 : Number(form.stock),
      weight: form.weight === '' ? undefined : Number(form.weight),
      materials: splitTags(form.materials),
      colors: splitTags(form.colors),
      tags: splitTags(form.tags),
      variants: form.variants.map((v) => ({
        ...v,
        priceDelta: Number(v.priceDelta) || 0,
        stock: Number(v.stock) || 0,
      })),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    const mutation = isEdit ? updateProduct : createProduct;
    const mutationArgs = isEdit ? { id, data: payload } : payload;

    mutation.mutate(mutationArgs, {
      onSuccess: () => {
        toast.success(isEdit ? 'Product updated' : 'Product created');
        navigate('/admin/products');
      },
      onError: (err) => {
        setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      },
    });
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section>
          <h2 className="mb-4 font-display text-lg">Basic Info</h2>
          <div className="flex flex-col gap-4">
            <Input label="Title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
            <Input
              label="Short Description"
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm text-stone-600">Description</span>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
              />
            </label>
            <Select label="Category" required value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select a category…</option>
              {categories?.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Pricing &amp; Stock</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Price (₦)" type="number" min="0" required value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} />
            <Input label="Stock (if no variants)" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            <Input label="Weight (g, optional)" type="number" min="0" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Materials, Colors &amp; Tags</h2>
          <div className="flex flex-col gap-4">
            <Input label="Materials (comma-separated)" value={form.materials} onChange={(e) => set('materials', e.target.value)} />
            <Input label="Colors (comma-separated)" value={form.colors} onChange={(e) => set('colors', e.target.value)} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Variants</h2>
            <button type="button" onClick={addVariant} className="text-sm text-accent hover:text-accent-dark">
              + Add Variant
            </button>
          </div>
          {form.variants.length === 0 && <p className="text-sm text-stone-600">No variants — this product sells as a single item.</p>}
          <div className="flex flex-col gap-3">
            {form.variants.map((v, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 border border-stone-300 p-3">
                <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} className="border border-stone-300 bg-paper px-2 py-1.5 text-sm" />
                <input placeholder="Color" value={v.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} className="border border-stone-300 bg-paper px-2 py-1.5 text-sm" />
                <input placeholder="Size" value={v.size} onChange={(e) => updateVariant(idx, 'size', e.target.value)} className="border border-stone-300 bg-paper px-2 py-1.5 text-sm" />
                <input placeholder="Material" value={v.material} onChange={(e) => updateVariant(idx, 'material', e.target.value)} className="border border-stone-300 bg-paper px-2 py-1.5 text-sm" />
                <input type="number" placeholder="Price +/-" value={v.priceDelta} onChange={(e) => updateVariant(idx, 'priceDelta', e.target.value)} className="border border-stone-300 bg-paper px-2 py-1.5 text-sm" />
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} className="w-full border border-stone-300 bg-paper px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeVariant(idx)} className="text-stone-600 hover:text-error">×</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Images</h2>
          <ImageUploadField multiple value={form.images} onChange={(v) => set('images', v)} />
        </section>

        <section className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </section>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Product'}</Button>
          <button type="button" onClick={() => navigate('/admin/products')} className="text-sm text-stone-600 hover:text-accent">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
