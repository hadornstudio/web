import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { NIGERIAN_STATES } from '../../constants/nigerianStates';
import { COUNTRIES } from '../../constants/countries';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';

const EMPTY_ADDRESS = { fullName: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'Nigeria', phone: '' };

export default function AddressBook() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['addresses'], queryFn: () => usersApi.listAddresses() });
  const addresses = data?.data?.addresses || [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });
  const addMutation = useMutation({
    mutationFn: usersApi.addAddress,
    onSuccess: () => { invalidate(); setShowForm(false); setForm(EMPTY_ADDRESS); },
  });
  const deleteMutation = useMutation({ mutationFn: usersApi.deleteAddress, onSuccess: invalidate });
  const setDefaultMutation = useMutation({ mutationFn: usersApi.setDefaultAddress, onSuccess: invalidate });

  return (
    <div>
      {addresses.length === 0 && !showForm && (
        <EmptyState title="No saved addresses" description="Add an address to speed up checkout." />
      )}

      <div className="flex flex-col gap-4">
        {addresses.map((address) => (
          <div key={address._id} className="flex items-start justify-between gap-4 border border-stone-300 p-4 text-sm">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-ink">{address.fullName}</span>
                {address.isDefault && <Badge tone="accent">Default</Badge>}
              </div>
              <p className="text-stone-600">
                {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}, {address.postalCode}, {address.country}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
              {!address.isDefault && (
                <button type="button" onClick={() => setDefaultMutation.mutate(address._id)} className="text-accent hover:text-accent-dark">
                  Set Default
                </button>
              )}
              <button type="button" onClick={() => deleteMutation.mutate(address._id)} className="text-stone-600 hover:text-error">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => { e.preventDefault(); addMutation.mutate(form); }}
          className="mt-6 grid grid-cols-1 gap-4 border border-stone-300 p-4 sm:grid-cols-2"
        >
          <Input label="Full Name" required className="sm:col-span-2" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Address Line 1" required className="sm:col-span-2" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          <Input label="Address Line 2 (optional)" className="sm:col-span-2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
          <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          {form.country === 'Nigeria' ? (
            <Select label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
              <option value="">Select a state…</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          ) : (
            <Input label="State / Province" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          )}
          <Input label="Postal Code" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          <Select label="Country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, state: '' })}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={addMutation.isPending}>Save Address</Button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-stone-600 hover:text-accent">Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="mt-6 text-sm text-accent hover:text-accent-dark">
          + Add New Address
        </button>
      )}
    </div>
  );
}
