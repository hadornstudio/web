import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promosApi } from '../api/promos';

export function useAdminPromos() {
  return useQuery({
    queryKey: ['promos', 'admin'],
    queryFn: () => promosApi.adminList(),
    select: (res) => res.data.promos,
  });
}

export function useAdminPromo(id) {
  const { data: promos, isLoading } = useAdminPromos();
  return { promo: promos?.find((p) => p._id === id), isLoading };
}

export function useCreatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promosApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promos'] }),
  });
}

export function useUpdatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => promosApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promos'] }),
  });
}

export function useDeletePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promosApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promos'] }),
  });
}

export function useAnnouncePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: promosApi.announce,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promos'] }),
  });
}
