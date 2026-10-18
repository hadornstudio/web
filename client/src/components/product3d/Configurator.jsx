import { formatCurrency } from '../../utils/formatCurrency';
import { defaultOption } from '../../utils/configurator';

const delta = (n) => (n > 0 ? ` +${formatCurrency(n)}` : '');

export default function Configurator({ config, selection, onChange }) {
  const setOption = (partId, optionId) =>
    onChange({ ...selection, options: { ...selection.options, [partId]: optionId } });

  const toggleAddon = (id) =>
    onChange({
      ...selection,
      addons: selection.addons.includes(id) ? selection.addons.filter((a) => a !== id) : [...selection.addons, id],
    });

  return (
    <div className="mt-8 border-t border-stone-300 pt-6">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Make it yours</p>

      <div className="mt-5 flex flex-col gap-6">
        {config.parts.map((part) => {
          const current = part.options.find((o) => o.id === selection.options[part.id]) || defaultOption(part);
          return (
            <fieldset key={part.id}>
              <legend className="text-sm text-ink">
                {part.label} <span className="text-stone-600">— {current.label}{delta(current.priceDelta)}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2.5" role="radiogroup" aria-label={part.label}>
                {part.options.map((option) => {
                  const selected = option.id === current.id;
                  if (part.type === 'scale') {
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setOption(part.id, option.id)}
                        className={`border px-3.5 py-2 text-xs transition-colors ${
                          selected ? 'border-accent bg-accent-tint text-accent-dark' : 'border-stone-300 text-ink hover:border-ink'
                        }`}
                      >
                        {option.label}
                        {delta(option.priceDelta)}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${option.label}${delta(option.priceDelta)}`}
                      title={`${option.label}${delta(option.priceDelta)}`}
                      onClick={() => setOption(part.id, option.id)}
                      className={`h-9 w-9 rounded-full border-2 transition-shadow ${
                        selected ? 'border-ink shadow-[0_0_0_2px_var(--color-paper),0_0_0_3.5px_var(--color-accent)]' : 'border-stone-300 hover:border-ink'
                      }`}
                      style={{ backgroundColor: option.color }}
                    />
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        {config.addons.length > 0 && (
          <fieldset>
            <legend className="text-sm text-ink">Add-ons</legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {config.addons.map((addon) => {
                const on = selection.addons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleAddon(addon.id)}
                    className={`border px-3.5 py-2 text-xs transition-colors ${
                      on ? 'border-accent bg-accent-tint text-accent-dark' : 'border-stone-300 text-ink hover:border-ink'
                    }`}
                  >
                    {on ? '✓ ' : '+ '}
                    {addon.label}
                    {delta(addon.priceDelta)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}
