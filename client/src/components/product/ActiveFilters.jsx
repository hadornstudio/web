import { AVAILABILITY_OPTIONS } from '../../config/constants';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency } from '../../utils/formatCurrency';

// Removable chips for whatever is currently applied, so it's always clear why the list looks the way it does.
export default function ActiveFilters({ filters, onChangeMany, onClear }) {
  const { data } = useCategories();
  const categoryName = data?.data?.categories?.find((c) => c.slug === filters.category)?.name;

  const chips = [];
  if (filters.category) chips.push({ id: 'category', label: categoryName || filters.category, clear: { category: '' } });
  if (filters.minPrice || filters.maxPrice) {
    const from = filters.minPrice ? formatCurrency(Number(filters.minPrice)) : null;
    const to = filters.maxPrice ? formatCurrency(Number(filters.maxPrice)) : null;
    chips.push({ id: 'price', label: from && to ? `${from} – ${to}` : from ? `From ${from}` : `Up to ${to}`, clear: { minPrice: '', maxPrice: '' } });
  }
  if (filters.availability) chips.push({ id: 'availability', label: AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability)?.label || filters.availability, clear: { availability: '' } });
  if (filters.color) chips.push({ id: 'color', label: filters.color, clear: { color: '' } });
  if (filters.material) chips.push({ id: 'material', label: filters.material, clear: { material: '' } });
  if (filters.search) chips.push({ id: 'search', label: `“${filters.search}”`, clear: { search: '' } });

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChangeMany(chip.clear)}
          aria-label={`Remove filter ${chip.label}`}
          className="flex items-center gap-2 border border-accent bg-accent-tint px-3 py-1.5 text-xs text-accent-dark hover:bg-accent hover:text-paper"
        >
          {chip.label}
          <span aria-hidden="true">×</span>
        </button>
      ))}
      <button type="button" onClick={onClear} className="px-2 py-1.5 text-xs uppercase tracking-wide text-stone-600 hover:text-accent">
        Clear all
      </button>
    </div>
  );
}
