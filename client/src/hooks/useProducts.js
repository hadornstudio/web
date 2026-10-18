import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
  });
}

// Catalog listing that loads the next page as the visitor scrolls (filters/sort reset it to page 1).
export function useInfiniteProducts(params) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: ({ pageParam }) => productsApi.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.data.page < last.data.pages ? last.data.page + 1 : undefined),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.featured(),
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useRelatedProducts(id) {
  return useQuery({
    queryKey: ['products', 'related', id],
    queryFn: () => productsApi.related(id),
    enabled: Boolean(id),
  });
}

// --- Admin ---

export function useAdminProducts() {
  return useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => productsApi.adminList(),
    select: (res) => res.data.products,
  });
}

export function useAdminProduct(id) {
  const { data: products, isLoading } = useAdminProducts();
  return { product: products?.find((p) => p._id === id), isLoading };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
