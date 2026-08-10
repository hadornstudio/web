import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAd, useCreateAd, useUpdateAd } from '../../hooks/useAds';
import { useAdminPromos } from '../../hooks/usePromos';
import { useAdminProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import AdMediaUploadField from '../../components/admin/AdMediaUploadField';
import { toast } from '../../store/useToastStore';

const PLACEMENTS = [
  { value: 'homepage-banner', label: 'Homepage Banner' },
  { value: 'shop-banner', label: 'Shop Banner' },
  { value: 'gallery-banner', label: 'Gallery Banner' },
];

const EMPTY_FORM = {
  title: '',
  mediaUrl: '',
  mediaType: 'image',
  placement: 'homepage-banner',
  linkType: 'none',
  promo: '',
  product: '',
  category: '',
  url: '',
  startsAt: '',
  endsAt: '',
  sortOrder: 0,
  isActive: true,
};

function toFormState(ad) {
  return {
    title: ad.title || '',
    mediaUrl: ad.mediaUrl || '',
    mediaType: ad.mediaType || 'image',
    placement: ad.placement || 'homepage-banner',
    linkType: ad.linkType || 'none',
    promo: ad.promo?._id || ad.promo || '',
    product: ad.product?._id || ad.product || '',
    category: ad.category?._id || ad.category || '',
    url: ad.url || '',
    startsAt: ad.startsAt ? ad.startsAt.slice(0, 10) : '',
    endsAt: ad.endsAt ? ad.endsAt.slice(0, 10) : '',
    sortOrder: ad.sortOrder ?? 0,
    isActive: ad.isActive ?? true,
  };
}

export default function AdminAdFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { ad, isLoading } = useAdminAd(id);
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const { data: promos } = useAdminPromos();
  const { data: products } = useAdminProducts();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && ad) setForm(toFormState(ad));
  }, [isEdit, ad]);

  if (isEdit && isLoading) return <Spinner />;
  if (isEdit && !isLoading && !ad) return <p>Ad not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.mediaUrl) {
      setError('Upload an image or video for this ad.');
      return;
    }

    const payload = {
      title: form.title,
      mediaUrl: form.mediaUrl,
      mediaType: form.mediaType,
      placement: form.placement,
      linkType: form.linkType,
      promo: form.linkType === 'promo' ? form.promo : undefined,
      product: form.linkType === 'product' ? form.product : undefined,
      category: form.linkType === 'category' ? form.category : undefined,
      url: form.linkType === 'url' ? form.url : undefined,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    const mutation = isEdit ? updateAd : createAd;
    const mutationArgs = isEdit ? { id, data: payload } : payload;

    mutation.mutate(mutationArgs, {
      onSuccess: () => {
        toast.success(isEdit ? 'Ad updated' : 'Ad created');
        navigate('/admin/ads');
      },
      onError: (err) => {
        setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      },
    });
  };

  const isSaving = createAd.isPending || updateAd.isPending;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl">{isEdit ? 'Edit Ad' : 'New Ad'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" required value={form.title} onChange={(e) => set('title', e.target.value)} />

        <AdMediaUploadField
          mediaUrl={form.mediaUrl}
          mediaType={form.mediaType}
          onChange={({ mediaUrl, mediaType }) => setForm((f) => ({ ...f, mediaUrl, mediaType }))}
        />

        <div>
          <Select label="Placement" value={form.placement} onChange={(e) => set('placement', e.target.value)}>
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-stone-600">Where this ad appears on the site. If more than one active ad shares a placement, the lowest sort order shows first.</p>
        </div>

        <Select label="Links To" value={form.linkType} onChange={(e) => set('linkType', e.target.value)}>
          <option value="none">Nothing — plain banner</option>
          <option value="promo">A Promo</option>
          <option value="product">A Product</option>
          <option value="category">A Category</option>
          <option value="url">External URL</option>
        </Select>

        {form.linkType === 'promo' && (
          <Select label="Promo" value={form.promo} onChange={(e) => set('promo', e.target.value)}>
            <option value="">Select a promo…</option>
            {promos?.map((p) => (
              <option key={p._id} value={p._id}>{p.title}{p.coupon?.code ? ` (${p.coupon.code})` : ''}</option>
            ))}
          </Select>
        )}

        {form.linkType === 'product' && (
          <Select label="Product" value={form.product} onChange={(e) => set('product', e.target.value)}>
            <option value="">Select a product…</option>
            {products?.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </Select>
        )}

        {form.linkType === 'category' && (
          <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
        )}

        {form.linkType === 'url' && (
          <Input label="URL" type="url" placeholder="https://…" value={form.url} onChange={(e) => set('url', e.target.value)} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Starts (optional)" type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
          <Input label="Ends (optional)" type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </div>

        <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Ad'}</Button>
          <button type="button" onClick={() => navigate('/admin/ads')} className="text-sm text-stone-600 hover:text-accent">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
