import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from '../api/coupons';

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['coupons', 'admin'],
    queryFn: () => couponsApi.adminList(),
    select: (res) => res.data.coupons,
  });
}

export function useAdminCoupon(id) {
  const { data: coupons, isLoading } = useAdminCoupons();
  return { coupon: coupons?.find((c) => c._id === id), isLoading };
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => couponsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: couponsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
}
