import { formatCurrency } from '../../utils/formatCurrency';

export default function VariantSelector({ variants, basePrice, selectedId, onSelect }) {
  if (!variants?.length) return null;

  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-wide text-stone-600">Select Option</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const label = [variant.color, variant.material].filter(Boolean).join(' · ');
          const price = basePrice + variant.priceDelta;
          const isSelected = selectedId === variant._id;
          const isOut = variant.stock <= 0;

          return (
            <button
              key={variant._id}
              type="button"
              disabled={isOut}
              onClick={() => onSelect(variant._id)}
              className={`flex flex-col items-start border px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected ? 'border-accent bg-accent-tint' : 'border-stone-300 hover:border-accent'
              }`}
            >
              <span className="text-sm text-ink">{label}</span>
              <span className="text-xs text-stone-600">
                {formatCurrency(price)}
                {isOut && ' · Out of stock'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
