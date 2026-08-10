import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: () => ordersApi.mine(),
  });
}

export function useMyOrder(id) {
  return useQuery({
    queryKey: ['orders', 'mine', id],
    queryFn: () => ordersApi.getMine(id),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

// --- Admin ---

export function useAdminOrders(params) {
  return useQuery({
    queryKey: ['orders', 'admin', params],
    queryFn: () => ordersApi.adminList(params),
    select: (res) => res.data.orders,
  });
}

export function useAdminOrder(id) {
  return useQuery({
    queryKey: ['orders', 'admin', id],
    queryFn: () => ordersApi.adminGet(id),
    select: (res) => res.data.order,
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }) => ordersApi.updateStatus(id, { status, note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}
