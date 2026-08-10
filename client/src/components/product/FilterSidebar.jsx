import { PRODUCT_MATERIALS, PRODUCT_COLORS, AVAILABILITY_OPTIONS } from '../../config/constants';
import { useCategories } from '../../hooks/useCategories';

function RadioOption({ label, checked, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-left text-sm text-ink">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
          checked ? 'border-accent' : 'border-stone-300'
        }`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </span>
      {label}
    </button>
  );
}

export default function FilterSidebar({ filters, onChange, onClear }) {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];

  // Buttons (not native radio inputs) so clicking an already-selected option can clear it —
  // native radios never fire onChange when clicking the one that's already checked.
  const toggle = (key, value) => {
    onChange(key, filters[key] === value ? '' : value);
  };

  return (
    <aside className="w-full shrink-0 md:w-56">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wide text-ink">Filter</h3>
        <button type="button" onClick={onClear} className="text-xs text-stone-600 hover:text-accent">
          Clear all
        </button>
      </div>

      {categories.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-stone-600">Category</p>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <RadioOption
                key={category._id}
                label={category.name}
                checked={filters.category === category.slug}
                onClick={() => toggle('category', category.slug)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-wide text-stone-600">Price</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onChange('minPrice', e.target.value)}
            className="w-full border border-stone-300 bg-paper px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
          <span className="text-stone-600">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onChange('maxPrice', e.target.value)}
            className="w-full border border-stone-300 bg-paper px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-wide text-stone-600">Availability</p>
        <div className="flex flex-col gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <RadioOption
              key={opt.value}
              label={opt.label}
              checked={filters.availability === opt.value}
              onClick={() => toggle('availability', opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-wide text-stone-600">Material</p>
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {PRODUCT_MATERIALS.map((material) => (
            <RadioOption
              key={material}
              label={material}
              checked={filters.material === material}
              onClick={() => toggle('material', material)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-wide text-stone-600">Color</p>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggle('color', color)}
              className={`border px-2.5 py-1 text-xs ${
                filters.color === color
                  ? 'border-accent bg-accent-tint text-accent-dark'
                  : 'border-stone-300 text-stone-600 hover:border-accent'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
