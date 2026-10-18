import { PRODUCT_MATERIALS, PRODUCT_COLORS, AVAILABILITY_OPTIONS } from '../../config/constants';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency } from '../../utils/formatCurrency';

const SWATCHES = {
  Ivory: '#f4ede1', Gold: '#c9a45c', Silver: '#cfd0d4', Turquoise: '#2fa6a0', Black: '#1b1714',
  Rose: '#d98a9b', Bronze: '#a8743b', Sage: '#9caf88', Terracotta: '#c0654a',
  Multicolor: 'conic-gradient(#c4553b, #c9a45c, #2fa6a0, #1f2a44, #d98a9b, #c4553b)',
};

const PRICE_PRESETS = [
  { label: 'Under ₦100k', minPrice: '', maxPrice: '100000' },
  { label: '₦100k – ₦200k', minPrice: '100000', maxPrice: '200000' },
  { label: 'Over ₦200k', minPrice: '200000', maxPrice: '' },
];

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${
        selected ? 'border-accent bg-accent-tint text-accent-dark' : 'border-stone-300 text-ink hover:border-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, summary, open = false, children }) {
  return (
    <details open={open} className="group border-b border-stone-300 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm uppercase tracking-wide text-ink [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {summary && <span className="ml-2 normal-case tracking-normal text-accent">· {summary}</span>}
        </span>
        <span className="text-stone-600 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

// The filters themselves — rendered in the desktop sidebar and inside the phone's bottom sheet.
// Every tap applies immediately (the product list updates behind the sheet).
export default function FilterPanel({ filters, onChange, onChangeMany }) {
  const { data } = useCategories();
  const categories = data?.data?.categories || [];
  const toggle = (key, value) => onChange(key, filters[key] === value ? '' : value);

  const priceSummary = filters.minPrice || filters.maxPrice
    ? [filters.minPrice && formatCurrency(Number(filters.minPrice)), filters.maxPrice && formatCurrency(Number(filters.maxPrice))].filter(Boolean).join(' – ')
    : '';
  const availabilityLabel = AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability)?.label;
  const categoryName = categories.find((c) => c.slug === filters.category)?.name;

  return (
    <div>
      {categories.length > 0 && (
        <Section title="Category" summary={categoryName} open>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c._id} selected={filters.category === c.slug} onClick={() => toggle('category', c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Section title="Price" summary={priceSummary} open>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const selected = filters.minPrice === preset.minPrice && filters.maxPrice === preset.maxPrice;
            return (
              <Chip
                key={preset.label}
                selected={selected}
                onClick={() => onChangeMany(selected ? { minPrice: '', maxPrice: '' } : { minPrice: preset.minPrice, maxPrice: preset.maxPrice })}
              >
                {preset.label}
              </Chip>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Min ₦"
            aria-label="Minimum price"
            value={filters.minPrice || ''}
            onChange={(e) => onChange('minPrice', e.target.value)}
            className="w-full border border-stone-300 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <span className="text-stone-600">–</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Max ₦"
            aria-label="Maximum price"
            value={filters.maxPrice || ''}
            onChange={(e) => onChange('maxPrice', e.target.value)}
            className="w-full border border-stone-300 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </Section>

      <Section title="Availability" summary={availabilityLabel} open>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <Chip key={opt.value} selected={filters.availability === opt.value} onClick={() => toggle('availability', opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Colour" summary={filters.color}>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_COLORS.map((color) => (
            <Chip key={color} selected={filters.color === color} onClick={() => toggle('color', color)}>
              <span className="h-3.5 w-3.5 rounded-full border border-stone-300" style={{ background: SWATCHES[color] }} />
              {color}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Material" summary={filters.material}>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_MATERIALS.map((material) => (
            <Chip key={material} selected={filters.material === material} onClick={() => toggle('material', material)}>
              {material}
            </Chip>
          ))}
        </div>
      </Section>
    </div>
  );
}
