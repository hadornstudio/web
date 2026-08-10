import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => usersApi.getWishlist(),
    enabled: isAuthenticated,
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['wishlist'] });

  const addMutation = useMutation({ mutationFn: usersApi.addToWishlist, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: usersApi.removeFromWishlist, onSuccess: invalidate });

  const wishlist = query.data?.data?.wishlist || [];
  const isWishlisted = (productId) => wishlist.some((p) => p._id === productId);

  return {
    wishlist,
    isLoading: query.isLoading,
    isWishlisted,
    add: addMutation.mutate,
    remove: removeMutation.mutate,
  };
}
