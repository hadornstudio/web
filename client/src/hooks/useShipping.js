import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../api/shipping';

export function useLocalShippingRates() {
  return useQuery({
    queryKey: ['shipping', 'local'],
    queryFn: () => shippingApi.localRates(),
    select: (res) => res.data.rates,
    staleTime: 5 * 60 * 1000,
  });
}

// Used at checkout once a real destination is known — covers both local (DB lookup) and
// international (Terminal Africa or flat-rate fallback) in one call.
export function useShippingQuote({ state, country, subtotal, items }, options = {}) {
  return useQuery({
    queryKey: ['shipping', 'quote', state, country, subtotal, items],
    queryFn: () => shippingApi.quote({ state, country, subtotal, items }),
    select: (res) => res.data,
    enabled: Boolean(country) && subtotal != null,
    ...options,
  });
}

// --- Admin ---

export function useAdminLocalRates() {
  return useQuery({
    queryKey: ['shipping', 'local', 'admin'],
    queryFn: () => shippingApi.adminLocalRates(),
    select: (res) => res.data.rates,
  });
}

export function useUpdateLocalRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shippingApi.updateLocalRates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping', 'local'] });
    },
  });
}

export function useAdminShippingSettings() {
  return useQuery({
    queryKey: ['shipping', 'settings'],
    queryFn: () => shippingApi.adminSettings(),
    select: (res) => res.data.settings,
  });
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shippingApi.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping', 'settings'] }),
  });
}
