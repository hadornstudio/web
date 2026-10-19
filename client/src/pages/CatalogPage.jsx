import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useInfiniteProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { usePageMeta } from '../hooks/usePageMeta';
import ProductGrid from '../components/product/ProductGrid';
import FilterPanel from '../components/product/FilterPanel';
import FilterSheet from '../components/product/FilterSheet';
import ActiveFilters from '../components/product/ActiveFilters';
import Select from '../components/common/Select';
import Spinner from '../components/common/Spinner';
import AdSlot from '../components/common/AdSlot';
import { SORT_OPTIONS } from '../config/constants';

const TYPING_FILTERS = ['search', 'minPrice', 'maxPrice']; // updated in place so typing doesn't spam the back button

export default function CatalogPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = {
    category: categorySlug || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    material: searchParams.get('material') || '',
    color: searchParams.get('color') || '',
    availability: searchParams.get('availability') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
  };

  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];
  const category = categories.find((c) => c.slug === categorySlug);
  usePageMeta({ title: category?.name || 'Shop', description: category?.description });

  const query = useInfiniteProducts(filters);
  const products = useMemo(() => query.data?.pages.flatMap((p) => p.data.products) ?? [], [query.data]);
  const total = query.data?.pages[0]?.data.total;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  // Category lives in the route (/shop/:categorySlug), the rest in the query string, so a view stays shareable.
  const updateFilters = (changes, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    let nextCategory = categorySlug || '';
    for (const [key, value] of Object.entries(changes)) {
      if (key === 'category') nextCategory = value;
      else if (value) next.set(key, value);
      else next.delete(key);
    }
    if ('category' in changes) {
      navigate({ pathname: nextCategory ? `/shop/${nextCategory}` : '/shop', search: next.toString() }, { replace });
    } else {
      setSearchParams(next, { replace });
    }
  };
  const updateFilter = (key, value) => updateFilters({ [key]: value }, { replace: TYPING_FILTERS.includes(key) });
  const clearFilters = () => navigate({ pathname: '/shop', search: filters.sort !== 'newest' ? `?sort=${filters.sort}` : '' });

  // Search: type freely, apply shortly after.
  const [searchInput, setSearchInput] = useState(filters.search);
  useEffect(() => setSearchInput(filters.search), [filters.search]);
  useEffect(() => {
    if (searchInput === filters.search) return undefined;
    const timer = setTimeout(() => updateFilter('search', searchInput), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Infinite scroll: fetch the next page shortly before the visitor reaches the end of the list.
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '800px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const appliedCount = [filters.category, filters.minPrice || filters.maxPrice, filters.availability, filters.color, filters.material].filter(Boolean).length;
  const hasAnyFilter = appliedCount > 0 || Boolean(filters.search);

  return (
    <div className="container-page py-10 md:py-16">
      <div className="mb-8 md:mb-12">
        <h1 className="font-display text-3xl md:text-4xl">{category?.name || 'Shop All'}</h1>
        {category?.description && <p className="mt-3 max-w-xl text-stone-600">{category.description}</p>}
      </div>

      <div className="mb-8 md:mb-12">
        <AdSlot placement="shop-banner" />
      </div>

      {/* Quick category jump — phones only; desktops have the sidebar. */}
      <div className="-mx-6 mb-4 overflow-x-auto px-6 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {[{ _id: 'all', name: 'All', slug: '' }, ...categories].map((c) => {
            const selected = (c.slug || '') === (categorySlug || '');
            return (
              <button
                key={c._id}
                type="button"
                onClick={() => updateFilter('category', c.slug)}
                aria-pressed={selected}
                className={`shrink-0 border px-4 py-2 text-xs uppercase tracking-wide ${
                  selected ? 'border-ink bg-ink text-paper' : 'border-stone-300 text-ink'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar: sticks under the header on phones so Filters and Sort are always one tap away. */}
      <div className="sticky top-20 z-30 -mx-6 border-b border-stone-300 bg-paper/95 px-6 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <div className="flex flex-wrap items-center gap-3 md:justify-between">
          <input
            type="search"
            placeholder="Search pieces…"
            aria-label="Search pieces"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-stone-300 bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none md:w-auto md:max-w-xs md:flex-1"
          />
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 border border-ink px-4 py-2.5 text-xs uppercase tracking-wide text-ink md:hidden"
          >
            Filters
            {appliedCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center bg-accent px-1 text-[11px] text-paper">{appliedCount}</span>}
          </button>
          <Select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            aria-label="Sort"
            wrapperClassName="min-w-0 flex-1 md:flex-none"
            className="w-full text-sm md:w-auto md:min-w-[190px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <ActiveFilters filters={filters} onChangeMany={updateFilters} onClear={clearFilters} />

      <div className="mt-8 flex flex-col gap-12 md:flex-row">
        <aside className="hidden w-64 shrink-0 md:sticky md:top-28 md:block md:max-h-[calc(100vh-8rem)] md:self-start md:overflow-y-auto md:pr-2">
          <div className="flex items-center justify-between border-b border-stone-300 pb-3">
            <h2 className="text-sm uppercase tracking-wide text-ink">Filter</h2>
            <button type="button" onClick={clearFilters} disabled={!hasAnyFilter} className="text-xs text-stone-600 hover:text-accent disabled:opacity-40">
              Clear all
            </button>
          </div>
          <FilterPanel filters={filters} onChange={updateFilter} onChangeMany={updateFilters} />
        </aside>

        <div className="min-w-0 flex-1">
          {query.isLoading ? (
            <Spinner />
          ) : (
            <>
              {total != null && (
                <p className="mb-6 text-sm text-stone-600" aria-live="polite">
                  {total} {total === 1 ? 'piece' : 'pieces'}
                </p>
              )}

              <ProductGrid products={products} />

              <div ref={sentinelRef} className="mt-12 flex min-h-16 flex-col items-center justify-center gap-4">
                {isFetchingNextPage && <Spinner />}
                {hasNextPage && !isFetchingNextPage && (
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    className="border border-ink px-8 py-3 text-xs uppercase tracking-wide text-ink hover:bg-ink hover:text-paper"
                  >
                    Load more
                  </button>
                )}
                {!hasNextPage && products.length > 12 && (
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-600">That&apos;s everything — {total} pieces</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} total={total} hasFilters={hasAnyFilter} onClear={clearFilters}>
        <FilterPanel filters={filters} onChange={updateFilter} onChangeMany={updateFilters} />
      </FilterSheet>
    </div>
  );
}
