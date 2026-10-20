import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminGalleryItem, useCreateGalleryItem, useUpdateGalleryItem } from '../../hooks/useGallery';
import { useCategories } from '../../hooks/useCategories';
import { useAdminProducts } from '../../hooks/useProducts';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { uploadsApi } from '../../api/uploads';
import { toast } from '../../store/useToastStore';

// three.js loads only when the owner actually opens the 3D preview.
const ModelPreview = lazy(() => import('../../components/admin/ModelPreview'));

const EMPTY_MODEL = { url: '', format: 'splat', height: 1.7, rotation: [0, 0, 0], offsetY: 0 };
const EMPTY_FORM = { title: '', description: '', images: [], category: '', product: '', sortOrder: 0, isActive: true, model: EMPTY_MODEL };

function toFormState(item) {
  return {
    title: item.title || '',
    description: item.description || '',
    images: item.images || [],
    category: item.category?._id || '',
    product: item.product?._id || '',
    sortOrder: item.sortOrder ?? 0,
    isActive: item.isActive ?? true,
    model: item.model?.url ? { ...EMPTY_MODEL, ...item.model } : EMPTY_MODEL,
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
  const [modelUploading, setModelUploading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelError, setModelError] = useState('');
  const modelInput = useRef(null);

  useEffect(() => {
    if (isEdit && item) setForm(toFormState(item));
  }, [isEdit, item]);

  if (isEdit && isLoading) return <Spinner />;
  if (isEdit && !isLoading && !item) return <p>Gallery item not found.</p>;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setModel = (patch) => setForm((f) => ({ ...f, model: { ...f.model, ...patch } }));
  const setRotation = (axis, value) =>
    setForm((f) => ({ ...f, model: { ...f.model, rotation: f.model.rotation.map((v, i) => (i === axis ? Number(value) : v)) } }));

  const handleModelFile = async (file) => {
    if (!file) return;
    setModelError('');
    setModelUploading(true);
    setModelProgress(0);
    try {
      const res = await uploadsApi.uploadModel(file, (evt) => evt.total && setModelProgress(Math.round((evt.loaded / evt.total) * 100)));
      setModel({ url: res.data.url, format: res.data.format });
    } catch (err) {
      setModelError(
        err.response?.data?.message ||
          'Upload failed. Very large files can be refused — host the file anywhere that serves https and paste the link instead.'
      );
    } finally {
      setModelUploading(false);
      if (modelInput.current) modelInput.current.value = '';
    }
  };

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
      // no link = no model (the server clears it)
      model: form.model.url
        ? {
            url: form.model.url.trim(),
            format: form.model.format,
            height: Number(form.model.height) || 1.7,
            rotation: form.model.rotation.map(Number),
            offsetY: Number(form.model.offsetY) || 0,
          }
        : null,
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

        <fieldset className="flex flex-col gap-4 border border-stone-300 p-4">
          <legend className="px-2 text-sm text-ink">3D model (shown in the showroom)</legend>
          <p className="text-xs text-stone-600">
            Once any piece has a model, the showroom hangs only pieces with a model, each on its own plinth (the photos still appear in the
            gallery and as the fallback). Use a <strong>.splat</strong> capture or a <strong>.glb</strong> file. Training tools usually export
            .ply — convert it first with <code>node scripts/ply-to-splat.mjs capture.ply piece.splat</code>, which also centres, levels and
            trims it.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={modelInput}
              type="file"
              accept=".splat,.glb"
              className="hidden"
              onChange={(e) => handleModelFile(e.target.files?.[0])}
            />
            <Button type="button" variant="secondary" disabled={modelUploading} onClick={() => modelInput.current?.click()}>
              {modelUploading ? `Uploading… ${modelProgress}%` : 'Upload .splat / .glb'}
            </Button>
            {form.model.url && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, model: EMPTY_MODEL }))} className="text-sm text-stone-600 hover:text-error">
                Remove model
              </button>
            )}
          </div>
          {modelError && <p className="text-sm text-error">{modelError}</p>}
          <Input label="…or paste a link to the file (https://…)" value={form.model.url} onChange={(e) => setModel({ url: e.target.value })} />

          {form.model.url && (
            <>
              <Select label="File type" value={form.model.format} onChange={(e) => setModel({ format: e.target.value })}>
                <option value="splat">Gaussian splat (.splat)</option>
                <option value="glb">3D mesh (.glb)</option>
              </Select>
              <Suspense fallback={<Spinner />}>
                <ModelPreview model={form.model} />
              </Suspense>
              <p className="-mt-2 text-xs text-stone-600">Drag the preview to look around. Adjust until the piece stands upright on the plinth.</p>
              {[
                ['Size — metres tall', 'height', 0.2, 3, 0.05, form.model.height],
                ['Raise / lower — metres', 'offsetY', -1, 1.5, 0.01, form.model.offsetY],
              ].map(([label, key, min, max, step, value]) => (
                <label key={key} className="block text-sm text-stone-600">
                  {label}: <span className="text-ink">{Number(value).toFixed(2)}</span>
                  <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setModel({ [key]: Number(e.target.value) })} className="mt-1 block w-full accent-[var(--color-accent)]" />
                </label>
              ))}
              {['Tilt forward / back (X)', 'Turn (Y)', 'Lean sideways (Z)'].map((label, axis) => (
                <label key={label} className="block text-sm text-stone-600">
                  {label}: <span className="text-ink">{form.model.rotation[axis]}°</span>
                  <input type="range" min={-180} max={180} step={1} value={form.model.rotation[axis]} onChange={(e) => setRotation(axis, e.target.value)} className="mt-1 block w-full accent-[var(--color-accent)]" />
                </label>
              ))}
            </>
          )}
        </fieldset>

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
