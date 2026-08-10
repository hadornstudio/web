import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '../api/ads';

export function useAdsByPlacement(placement) {
  return useQuery({
    queryKey: ['ads', placement],
    queryFn: () => adsApi.list(placement),
    select: (res) => res.data.ads,
    enabled: Boolean(placement),
    staleTime: 60 * 1000,
  });
}

export function useAdminAds() {
  return useQuery({
    queryKey: ['ads', 'admin'],
    queryFn: () => adsApi.adminList(),
    select: (res) => res.data.ads,
  });
}

export function useAdminAd(id) {
  const { data: ads, isLoading } = useAdminAds();
  return { ad: ads?.find((a) => a._id === id), isLoading };
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] }),
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] }),
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] }),
  });
}
