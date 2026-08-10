import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import Input from '../common/Input';
import Button from '../common/Button';

const EMPTY_ADDRESS = { fullName: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'Nigeria', phone: '' };

export default function ShippingForm({ onContinue }) {
  const { data } = useQuery({ queryKey: ['addresses'], queryFn: () => usersApi.listAddresses() });
  const addresses = data?.data?.addresses || [];

  const [selectedId, setSelectedId] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);

  useEffect(() => {
    if (addresses.length && !selectedId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedId(def._id);
    } else if (!addresses.length) {
      setShowNewForm(true);
    }
  }, [addresses.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showNewForm || !selectedId) {
      onContinue(form);
    } else {
      const address = addresses.find((a) => a._id === selectedId);
      onContinue(address);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {addresses.length > 0 && !showNewForm && (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <label
              key={address._id}
              className={`flex cursor-pointer items-start gap-3 border p-4 text-sm ${
                selectedId === address._id ? 'border-accent bg-accent-tint' : 'border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedId === address._id}
                onChange={() => setSelectedId(address._id)}
                className="mt-1 accent-accent"
              />
              <span>
                <span className="block text-ink">{address.fullName}</span>
                <span className="block text-stone-600">
                  {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}, {address.postalCode}, {address.country}
                </span>
              </span>
            </label>
          ))}
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="self-start text-sm text-accent hover:text-accent-dark"
          >
            + Use a new address
          </button>
        </div>
      )}

      {showNewForm && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" required className="sm:col-span-2" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Address Line 1" required className="sm:col-span-2" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <Input label="Address Line 2 (optional)" className="sm:col-span-2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input label="Postal Code" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          <Input label="Country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input label="Phone (optional)" className="sm:col-span-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          {addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="self-start text-sm text-stone-600 hover:text-accent sm:col-span-2"
            >
              ← Use a saved address
            </button>
          )}
        </div>
      )}

      <Button type="submit" className="self-start">Continue to Review</Button>
    </form>
  );
}
