import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useUpdatePreferences } from '../../hooks/useUsers';
import Button from '../common/Button';

// Inline, dismissible — never a blocking modal. Lives at the top of the "For You" dashboard
// so it only appears in the one place it's actually relevant, and either action (save or
// skip) marks the user onboarded so it never shows again.
export default function PreferencePicker() {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];
  const [selected, setSelected] = useState([]);
  const { mutate, isPending } = useUpdatePreferences();

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  return (
    <div className="border border-stone-300 bg-cream p-6 md:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Just for you</p>
      <h2 className="mt-2 font-display text-2xl">What catches your eye?</h2>
      <p className="mt-2 max-w-lg text-sm text-stone-600">
        Pick a few categories you're drawn to and we'll shape your recommendations around them.
        Nothing here is final — your dashboard keeps adapting as you browse, wishlist, and order.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => toggle(c._id)}
            className={`border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
              selected.includes(c._id)
                ? 'border-accent bg-accent-tint text-accent-dark'
                : 'border-stone-300 text-stone-600 hover:border-accent'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button
          onClick={() => mutate({ categories: selected, onboarded: true })}
          disabled={isPending || selected.length === 0}
        >
          {isPending ? 'Saving…' : 'Save Preferences'}
        </Button>
        <button
          type="button"
          onClick={() => mutate({ categories: [], onboarded: true })}
          disabled={isPending}
          className="text-xs uppercase tracking-wide text-stone-600 hover:text-ink"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
