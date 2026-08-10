import { useState } from 'react';
import { useLocalShippingRates } from '../../hooks/useShipping';
import Select from '../common/Select';
import { formatCurrency } from '../../utils/formatCurrency';

// Informational only — the authoritative cost is always resolved at checkout against the
// customer's real address. This just lets someone browsing a product see roughly what
// local delivery costs before they commit to a purchase.
export default function LocalShippingEstimate() {
  const { data: rates, isLoading } = useLocalShippingRates();
  const [state, setState] = useState('');

  if (isLoading || !rates?.length) return null;

  const selected = rates.find((r) => r.state === state);

  return (
    <div className="mt-8 border border-stone-300 p-4 text-sm">
      <p className="mb-2 text-ink">Estimate shipping (Nigeria)</p>
      <Select value={state} onChange={(e) => setState(e.target.value)} className="max-w-[220px]">
        <option value="">Select your state…</option>
        {rates.map((r) => (
          <option key={r.state} value={r.state}>{r.state}</option>
        ))}
      </Select>
      {selected && (
        <p className="mt-2 text-stone-600">
          Delivery to {selected.state}:{' '}
          <span className="text-ink">{selected.price === 0 ? 'Free' : formatCurrency(selected.price)}</span>
        </p>
      )}
      <p className="mt-2 text-xs text-stone-600">Shipping outside Nigeria via DHL — calculated at checkout.</p>
    </div>
  );
}
