import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(slug) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

// --- Admin ---

export function useAdminCategories() {
  return useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: () => categoriesApi.adminList(),
    select: (res) => res.data.categories,
  });
}

export function useAdminCategory(id) {
  const { data: categories, isLoading } = useAdminCategories();
  return { category: categories?.find((c) => c._id === id), isLoading };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
