import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews';

export function useProductReviews(productId, params) {
  return useQuery({
    queryKey: ['reviews', productId, params],
    queryFn: () => reviewsApi.listForProduct(productId, params),
    enabled: Boolean(productId),
  });
}

export function useCreateReview(productId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reviewsApi.create(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}
