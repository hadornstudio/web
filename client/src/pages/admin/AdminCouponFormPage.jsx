import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminCoupon, useCreateCoupon, useUpdateCoupon } from '../../hooks/useCoupons';
import { useCategories } from '../../hooks/useCategories';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { toast } from '../../store/useToastStore';

const EMPTY_FORM = {
  code: '',
  type: 'percent',
  value: '',
  minOrderValue: '',
  maxDiscountAmount: '',
  usageLimit: '',
  perUserLimit: 1,
  expiresAt: '',
  isActive: true,
  minQuantity: '',
  minQuantityCategory: '',
};

function toFormState(coupon) {
  return {
    code: coupon.code || '',
    type: coupon.type || 'percent',
    value: coupon.value ?? '',
    minOrderValue: coupon.minOrderValue ?? '',
    maxDiscountAmount: coupon.maxDiscountAmount ?? '',
    usageLimit: coupon.usageLimit ?? '',
    perUserLimit: coupon.perUserLimit ?? 1,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    isActive: coupon.isActive ?? true,
    minQuantity: coupon.conditions?.minQuantity ?? '',
    minQuantityCategory: coupon.conditions?.minQuantityCategory || '',
  };
}

export default function AdminCouponFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { coupon, isLoading } = useAdminCoupon(id);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && coupon) setForm(toFormState(coupon));
  }, [isEdit, coupon]);

  if (isEdit && isLoading) return <Spinner />;
  if (isEdit && !isLoading && !coupon) return <p>Coupon not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrderValue: form.minOrderValue === '' ? 0 : Number(form.minOrderValue),
      maxDiscountAmount: form.maxDiscountAmount === '' ? undefined : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
      perUserLimit: Number(form.perUserLimit) || 1,
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
      conditions: {
        minQuantity: form.minQuantity === '' ? undefined : Number(form.minQuantity),
        minQuantityCategory: form.minQuantityCategory || undefined,
      },
    };

    const mutation = isEdit ? updateCoupon : createCoupon;
    const mutationArgs = isEdit ? { id, data: payload } : payload;

    mutation.mutate(mutationArgs, {
      onSuccess: () => {
        toast.success(isEdit ? 'Coupon updated' : 'Coupon created');
        navigate('/admin/coupons');
      },
      onError: (err) => {
        setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      },
    });
  };

  const isSaving = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl">{isEdit ? 'Edit Coupon' : 'New Coupon'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Code"
          required
          value={form.code}
          onChange={(e) => set('code', e.target.value.toUpperCase())}
        />

        <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)}>
          <option value="percent">Percent</option>
          <option value="flat">Flat</option>
        </Select>

        <Input
          label={form.type === 'percent' ? 'Value (%)' : 'Value (₦)'}
          type="number"
          min="0"
          required
          value={form.value}
          onChange={(e) => set('value', e.target.value)}
        />

        <Input label="Minimum Order Value (₦)" type="number" min="0" value={form.minOrderValue} onChange={(e) => set('minOrderValue', e.target.value)} />

        {form.type === 'percent' && (
          <Input label="Max Discount Amount (₦, optional)" type="number" min="0" value={form.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)} />
        )}

        <Input label="Usage Limit (optional)" type="number" min="0" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
        <Input label="Per-User Limit" type="number" min="1" value={form.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} />
        <Input label="Expires At (optional)" type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />

        <div className="border-t border-stone-300 pt-4">
          <p className="mb-1 text-sm text-ink">Conditional Rule (optional)</p>
          <p className="mb-3 text-xs text-stone-600">
            Require a minimum quantity of items — optionally scoped to one category — for this coupon to apply.
            E.g. "buy 5 necklaces" = quantity 5 + category Necklaces. Leave the category blank to count items across
            the whole cart, e.g. "buy 3 pieces, any category."
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Quantity"
              type="number"
              min="1"
              value={form.minQuantity}
              onChange={(e) => set('minQuantity', e.target.value)}
            />
            <Select label="In Category (optional)" value={form.minQuantityCategory} onChange={(e) => set('minQuantityCategory', e.target.value)}>
              <option value="">Any category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Coupon'}</Button>
          <button type="button" onClick={() => navigate('/admin/coupons')} className="text-sm text-stone-600 hover:text-accent">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
