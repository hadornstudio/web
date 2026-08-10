import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useGalleryItems } from '../hooks/useGallery';
import { useCategories } from '../hooks/useCategories';
import { useScrollReveal } from '../hooks/useScrollReveal';
import GalleryLikeButton from '../components/common/GalleryLikeButton';
import Modal from '../components/common/Modal';
import AdSlot from '../components/common/AdSlot';
import Select from '../components/common/Select';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'likes', label: 'Most Liked' },
];

function OrderButton({ item }) {
  const navigate = useNavigate();

  if (item.product) {
    return (
      <Link
        to={`/product/${item.product.slug}`}
        onClick={(e) => e.stopPropagation()}
        className="text-xs uppercase tracking-wide text-accent hover:text-accent-dark"
      >
        Order This →
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate('/custom-order', { state: { referenceImage: item.images[0], pieceTitle: item.title } });
      }}
      className="text-xs uppercase tracking-wide text-accent hover:text-accent-dark"
    >
      Order This →
    </button>
  );
}

export default function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  const { data, isLoading } = useGalleryItems({ category: category || undefined, sort });
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];
  const items = data?.data?.items || [];

  const gridRef = useScrollReveal({ selector: '.gallery-card', y: 16, stagger: 0.05, deps: [items.length] });
  const [modalItem, setModalItem] = useState(null);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="container-page py-16">
      <div className="mb-12 max-w-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Our Works</p>
        <h1 className="mt-3 font-display text-4xl">The Gallery</h1>
        <p className="mt-4 text-stone-600">
          A look inside the studio — pieces in progress, technique studies, and work that isn't
          necessarily for sale, just worth showing. Sign in to like what catches your eye, or order
          a piece directly.
        </p>
      </div>

      <div className="mb-12">
        <AdSlot placement="gallery-banner" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('category', '')}
            className={`border px-3 py-1.5 text-xs uppercase tracking-wide ${
              !category ? 'border-accent bg-accent-tint text-accent-dark' : 'border-stone-300 text-stone-600 hover:border-accent'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setFilter('category', category === c.slug ? '' : c.slug)}
              className={`border px-3 py-1.5 text-xs uppercase tracking-wide ${
                category === c.slug ? 'border-accent bg-accent-tint text-accent-dark' : 'border-stone-300 text-stone-600 hover:border-accent'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <Select value={sort} onChange={(e) => setFilter('sort', e.target.value)} className="w-auto max-w-[180px]">
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Try a different filter, or check back soon." />
      ) : (
        <div ref={gridRef} className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
          {items.map((item) => (
            <div key={item._id} className="gallery-card">
              <button
                type="button"
                onClick={() => setModalItem(item)}
                className="block aspect-square w-full overflow-hidden bg-cream"
              >
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-105"
                />
              </button>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  {item.category && (
                    <p className="text-xs uppercase tracking-wide text-stone-600">{item.category.name}</p>
                  )}
                  <h3 className="text-sm text-ink">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-xs text-stone-600 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-2">
                    <OrderButton item={item} />
                  </div>
                </div>
                <GalleryLikeButton itemId={item._id} likesCount={item.likesCount} className="shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(modalItem)} onClose={() => setModalItem(null)}>
        {modalItem && (
          <div>
            <img src={modalItem.images[0]} alt={modalItem.title} className="max-h-[75vh] w-auto object-contain" />
            <div className="mt-4 flex items-center justify-between gap-4 text-paper">
              <div>
                <h3 className="font-display text-xl">{modalItem.title}</h3>
                {modalItem.description && <p className="mt-1 max-w-md text-sm text-stone-300">{modalItem.description}</p>}
              </div>
              <OrderButton item={modalItem} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
