import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminPromo, useCreatePromo, useUpdatePromo } from '../../hooks/usePromos';
import { useAdminCoupons } from '../../hooks/useCoupons';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { toast } from '../../store/useToastStore';

const EMPTY_FORM = { title: '', description: '', bannerImage: '', coupon: '', startsAt: '', endsAt: '', isActive: true };

function toFormState(promo) {
  return {
    title: promo.title || '',
    description: promo.description || '',
    bannerImage: promo.bannerImage || '',
    coupon: promo.coupon?._id || promo.coupon || '',
    startsAt: promo.startsAt ? promo.startsAt.slice(0, 10) : '',
    endsAt: promo.endsAt ? promo.endsAt.slice(0, 10) : '',
    isActive: promo.isActive ?? true,
  };
}

export default function AdminPromoFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { promo, isLoading } = useAdminPromo(id);
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const { data: coupons } = useAdminCoupons();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && promo) setForm(toFormState(promo));
  }, [isEdit, promo]);

  if (isEdit && isLoading) return <Spinner />;
  if (isEdit && !isLoading && !promo) return <p>Promo not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      title: form.title,
      description: form.description,
      bannerImage: form.bannerImage || undefined,
      coupon: form.coupon || undefined,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
      isActive: form.isActive,
    };

    const mutation = isEdit ? updatePromo : createPromo;
    const mutationArgs = isEdit ? { id, data: payload } : payload;

    mutation.mutate(mutationArgs, {
      onSuccess: () => {
        toast.success(isEdit ? 'Promo updated' : 'Promo created');
        navigate('/admin/promos');
      },
      onError: (err) => {
        setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      },
    });
  };

  const isSaving = createPromo.isPending || updatePromo.isPending;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl">{isEdit ? 'Edit Promo' : 'New Promo'}</h1>

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
            placeholder="Short marketing copy — shown on the ad banner and in the announcement email."
          />
        </label>

        <ImageUploadField label="Banner Image (optional)" value={form.bannerImage} onChange={(v) => set('bannerImage', v)} />

        <div>
          <Select label="Linked Coupon (optional)" value={form.coupon} onChange={(e) => set('coupon', e.target.value)}>
            <option value="">No coupon — announcement only</option>
            {coupons?.map((c) => (
              <option key={c._id} value={c._id}>{c.code} — {c.type === 'percent' ? `${c.value}%` : `₦${c.value}`} off</option>
            ))}
          </Select>
          <p className="mt-1.5 text-xs text-stone-600">
            If linked, the coupon code is shown on the ad banner and included in the announcement email.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Starts (optional)" type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
          <Input label="Ends (optional)" type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Promo'}</Button>
          <button type="button" onClick={() => navigate('/admin/promos')} className="text-sm text-stone-600 hover:text-accent">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
