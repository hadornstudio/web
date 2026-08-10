import { useState } from 'react';
import {
  useAdminLocalRates,
  useUpdateLocalRates,
  useAdminShippingSettings,
  useUpdateShippingSettings,
} from '../../hooks/useShipping';
import DataTable from '../../components/admin/DataTable';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from '../../store/useToastStore';

function PriceInput({ rate, onSave }) {
  const [value, setValue] = useState(rate.price ?? '');

  return (
    <input
      type="number"
      min="0"
      placeholder="Not set"
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const n = value === '' ? null : Number(value);
        if (n !== (rate.price ?? null)) onSave(n);
      }}
      className="w-28 border border-stone-300 bg-paper px-2 py-1 text-sm"
    />
  );
}

function LocalRatesTable() {
  const { data: rates, isLoading } = useAdminLocalRates();
  const updateRates = useUpdateLocalRates();

  const saveOne = (state, price) => {
    updateRates.mutate([{ state, price }], {
      onSuccess: () => toast.success(`${state} rate updated`),
      onError: () => toast.error('Could not update rate'),
    });
  };

  const columns = [
    { key: 'state', header: 'State' },
    { key: 'price', header: 'Shipping Fee (₦)', render: (r) => <PriceInput rate={r} onSave={(n) => saveOne(r.state, n)} /> },
    { key: 'current', header: 'Currently', render: (r) => (r.price != null ? formatCurrency(r.price) : <span className="text-stone-400">Not priced</span>) },
  ];

  return (
    <DataTable columns={columns} data={rates} isLoading={isLoading} emptyMessage="No states found" />
  );
}

function SettingsForm() {
  const { data: settings, isLoading } = useAdminShippingSettings();
  const updateSettings = useUpdateShippingSettings();
  const [form, setForm] = useState(null);

  const current = form || settings;
  if (isLoading || !current) return <Spinner />;

  const set = (key, value) => setForm({ ...current, [key]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings.mutate(
      {
        defaultLocalRate: current.defaultLocalRate === '' ? null : current.defaultLocalRate,
        internationalFlatRate: current.internationalFlatRate === '' ? null : current.internationalFlatRate,
        originLine1: current.originLine1,
        originCity: current.originCity,
        originState: current.originState,
        originPhone: current.originPhone,
      },
      {
        onSuccess: () => { toast.success('Shipping settings saved'); setForm(null); },
        onError: () => toast.error('Could not save settings'),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <Input
          label="Default Local Rate (₦, optional)"
          type="number"
          min="0"
          value={current.defaultLocalRate ?? ''}
          onChange={(e) => set('defaultLocalRate', e.target.value)}
        />
        <p className="mt-1.5 text-xs text-stone-600">Used at checkout if a customer's state hasn't been priced above yet.</p>
      </div>

      <div>
        <Input
          label="International Flat Rate (₦, optional)"
          type="number"
          min="0"
          value={current.internationalFlatRate ?? ''}
          onChange={(e) => set('internationalFlatRate', e.target.value)}
        />
        <p className="mt-1.5 text-xs text-stone-600">
          Used for international orders when a live DHL/Terminal Africa quote isn't available or isn't configured.
        </p>
      </div>

      <div className="border-t border-stone-300 pt-4">
        <p className="mb-1 text-sm text-ink">Pickup Address (for international rate quotes)</p>
        <p className="mb-3 text-xs text-stone-600">Where Terminal Africa collects packages from — needed before live DHL quotes can work.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Street Address" className="sm:col-span-2" value={current.originLine1 || ''} onChange={(e) => set('originLine1', e.target.value)} />
          <Input label="City" value={current.originCity || ''} onChange={(e) => set('originCity', e.target.value)} />
          <Input label="State" value={current.originState || ''} onChange={(e) => set('originState', e.target.value)} />
          <Input label="Phone" className="sm:col-span-2" value={current.originPhone || ''} onChange={(e) => set('originPhone', e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={updateSettings.isPending} className="self-start">
        {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
      </Button>
    </form>
  );
}

export default function AdminShippingPage() {
  const [tab, setTab] = useState('local');

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Shipping</h1>

      <div className="mb-6 flex gap-6 border-b border-stone-300 text-sm uppercase tracking-wide">
        <button
          type="button"
          onClick={() => setTab('local')}
          className={`-mb-px border-b-2 pb-3 ${tab === 'local' ? 'border-accent text-accent' : 'border-transparent text-stone-600 hover:text-ink'}`}
        >
          Local Rates (Nigeria)
        </button>
        <button
          type="button"
          onClick={() => setTab('settings')}
          className={`-mb-px border-b-2 pb-3 ${tab === 'settings' ? 'border-accent text-accent' : 'border-transparent text-stone-600 hover:text-ink'}`}
        >
          Settings & International
        </button>
      </div>

      {tab === 'local' ? <LocalRatesTable /> : <SettingsForm />}
    </div>
  );
}
