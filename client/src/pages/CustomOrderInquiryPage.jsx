import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { inquiriesApi } from '../api/inquiries';
import { useAuthStore } from '../store/useAuthStore';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../lib/motion/gsapConfig';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ImageUploadField from '../components/admin/ImageUploadField';

const EMPTY_FORM = { name: '', email: '', phone: '', description: '', budgetRange: '', referenceImages: [] };

const SLIDESHOW_IMAGES = [
  'https://images.unsplash.com/photo-1715374033196-0ff662284a7e?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522065893269-6fd20f6d7438?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611107683227-e9060eccd846?q=80&w=1400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1626252685643-8a305c55e98d?q=80&w=1400&auto=format&fit=crop',
];

function Slideshow() {
  const [index, setIndex] = useState(0);
  const imgRefs = useRef([]);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDESHOW_IMAGES.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const current = imgRefs.current[index];
    if (!current) return;
    if (prefersReducedMotion()) {
      gsap.set(current, { autoAlpha: 1 });
      return;
    }
    gsap.fromTo(current, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.slow, ease: EASE.reveal });
  }, [index]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-cream">
      {SLIDESHOW_IMAGES.map((src, i) => (
        <img
          key={src}
          ref={(el) => (imgRefs.current[i] = el)}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
      <div className="absolute bottom-8 left-8 right-8 text-paper">
        <p className="text-xs uppercase tracking-[0.2em]">Bespoke</p>
        <p className="mt-2 font-display text-2xl">Made to your exact vision.</p>
      </div>
    </div>
  );
}

export default function CustomOrderInquiryPage() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const incoming = location.state; // { referenceImage, pieceTitle } when arriving from a gallery "Order This" click

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    name: user?.name || '',
    email: user?.email || '',
    referenceImages: incoming?.referenceImage ? [incoming.referenceImage] : [],
    description: incoming?.pieceTitle ? `I'd love something like "${incoming.pieceTitle}" from the gallery — ` : '',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      await inquiriesApi.create(form);
      setStatus('success');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Something went wrong.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="container-page flex justify-center py-32 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-3xl">Thank You</h1>
          <p className="mt-4 text-stone-600">
            We've received your inquiry and will be in touch within a few days to talk through your piece.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="h-64 md:h-auto md:min-h-screen">
        <Slideshow />
      </div>

      <div className="container-page flex items-center py-16 md:px-16">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Bespoke</p>
          <h1 className="mt-3 font-display text-4xl">Start a Custom Order</h1>
          <p className="mt-4 text-stone-600">
            Tell us what you have in mind — a reference image, a palette, an occasion — and we'll follow up to
            talk through materials, timeline, and price before we begin.
          </p>

          {incoming?.pieceTitle && (
            <p className="mt-4 border border-accent bg-accent-tint px-4 py-2.5 text-sm text-accent-dark">
              Starting from "{incoming.pieceTitle}" in the gallery — feel free to edit anything below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Budget Range (optional)" placeholder="e.g. ₦80,000 – ₦150,000" value={form.budgetRange} onChange={(e) => setForm({ ...form, budgetRange: e.target.value })} />

            <label className="block">
              <span className="mb-1.5 block text-sm text-stone-600">Tell us about your piece</span>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-stone-300 bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
                placeholder="Materials, colors, occasion, inspiration — anything that helps us picture it."
              />
            </label>

            <ImageUploadField
              multiple
              label="Reference Images (optional)"
              value={form.referenceImages}
              onChange={(v) => setForm({ ...form, referenceImages: v })}
              endpoint="/uploads/inquiry"
            />

            {error && <p className="text-sm text-error">{error}</p>}

            <Button type="submit" disabled={status === 'submitting'} className="self-start">
              {status === 'submitting' ? 'Sending…' : 'Send Inquiry'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
