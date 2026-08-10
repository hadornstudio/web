import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import ProductGrid from '../components/product/ProductGrid';
import FilterSidebar from '../components/product/FilterSidebar';
import Select from '../components/common/Select';
import Spinner from '../components/common/Spinner';
import AdSlot from '../components/common/AdSlot';
import { SORT_OPTIONS } from '../config/constants';

export default function CatalogPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters = {
    category: categorySlug || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    material: searchParams.get('material') || '',
    color: searchParams.get('color') || '',
    availability: searchParams.get('availability') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') || '1',
  };

  const { data: categoriesData } = useCategories();
  const category = categoriesData?.data?.categories.find((c) => c.slug === categorySlug);

  const { data, isLoading } = useProducts(filters);

  const products = data?.data?.products || [];
  const pages = data?.data?.pages || 1;
  const page = Number(filters.page);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');

    // Category lives in the route (/shop/:categorySlug), not a query param, so picking a
    // different one from the sidebar navigates instead of updating searchParams — keeps
    // category URLs shareable/SEO-friendly and in sync with the top nav's category links.
    if (key === 'category') {
      navigate({ pathname: value ? `/shop/${value}` : '/shop', search: next.toString() });
      return;
    }

    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => navigate('/shop');

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  return (
    <div className="container-page py-16">
      <div className="mb-12">
        <h1 className="font-display text-4xl">{category?.name || 'Shop All'}</h1>
        {category?.description && <p className="mt-3 max-w-xl text-stone-600">{category.description}</p>}
      </div>

      <div className="mb-12">
        <AdSlot placement="shop-banner" />
      </div>

      <div className="mb-8 flex items-center justify-between gap-4">
        <input
          type="search"
          placeholder="Search pieces…"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full max-w-xs border border-stone-300 bg-paper px-4 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <Select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-auto max-w-[200px]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-12 md:flex-row">
        <FilterSidebar filters={filters} onChange={updateFilter} onClear={clearFilters} />

        <div className="flex-1">
          {isLoading ? (
            <Spinner />
          ) : (
            <>
              <ProductGrid products={products} />

              {pages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-3">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => goToPage(p)}
                      className={`h-8 w-8 text-sm ${p === page ? 'bg-accent text-paper' : 'text-stone-600 hover:text-accent'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
