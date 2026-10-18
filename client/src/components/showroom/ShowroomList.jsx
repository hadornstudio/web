import { Link } from 'react-router-dom';
import { SHOWROOM } from './showroomConfig';

// Plain HTML list of the same works. It's the fallback (no WebGL / reduced motion / ?view=list) and,
// visually hidden, the text content search engines and screen readers get behind the 3D hall.
export default function ShowroomList({ works, hidden = false, notice, onEnter3D }) {
  return (
    <section className={hidden ? 'sr-only' : 'container-page py-10'} aria-label="Gallery pieces">
      {!hidden && (
        <nav className="mb-10 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
          <Link to="/" className="text-ink hover:text-accent">← Hadorn Studio</Link>
          <span className="flex gap-6">
            <Link to="/gallery" className="text-stone-600 hover:text-accent">Gallery</Link>
            <Link to="/shop" className="text-stone-600 hover:text-accent">Shop</Link>
          </span>
        </nav>
      )}
      <h1 className={hidden ? '' : 'font-display text-4xl'}>Hadorn Studio — {SHOWROOM.title}</h1>
      <p className={hidden ? '' : 'mt-3 max-w-xl text-stone-600'}>{SHOWROOM.subline}</p>
      {!hidden && notice && <p className="mt-2 text-sm text-stone-600">{notice}</p>}
      {!hidden && onEnter3D && (
        <button type="button" onClick={onEnter3D} className="mt-6 border border-ink px-6 py-3 text-sm uppercase tracking-wide text-ink hover:bg-ink hover:text-paper">
          Walk through the 3D gallery
        </button>
      )}
      <div className={hidden ? '' : 'mt-12 grid grid-cols-1 gap-10 md:grid-cols-2'}>
        {works.map((work) => (
          <article key={work.id}>
            {!hidden && <img src={work.images[0]} alt={work.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />}
            <h2 className={hidden ? '' : 'mt-4 font-display text-xl'}>{work.title}</h2>
            <p className={hidden ? '' : 'text-xs uppercase tracking-wide text-stone-600'}>{[work.category, work.year].filter(Boolean).join(' · ')}</p>
            <p className={hidden ? '' : 'mt-2 text-sm text-stone-600'}>{work.story}</p>
            {!hidden && (
              <Link
                to={work.productSlug ? `/product/${work.productSlug}` : '/custom-order'}
                state={work.productSlug ? undefined : { referenceImage: work.images[0], pieceTitle: work.title }}
                className="mt-3 inline-block text-xs uppercase tracking-wide text-accent hover:text-accent-dark"
              >
                {SHOWROOM.ctaLabel} →
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
