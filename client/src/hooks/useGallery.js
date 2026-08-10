import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryApi } from '../api/gallery';
import { useAuthStore } from '../store/useAuthStore';

export function useGalleryItems(params = {}) {
  return useQuery({
    queryKey: ['gallery', params],
    queryFn: () => galleryApi.list(params),
  });
}

export function useGalleryLikes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['gallery', 'mine', 'liked'],
    queryFn: () => galleryApi.myLikedIds(),
    enabled: isAuthenticated,
  });

  const likedIds = query.data?.data?.galleryItemIds || [];
  const isLiked = (itemId) => likedIds.includes(itemId);

  const toggleMutation = useMutation({
    mutationFn: (itemId) => galleryApi.toggleLike(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
  });

  return { isLiked, toggleLike: toggleMutation.mutate };
}

// --- Admin ---

export function useAdminGalleryItems() {
  return useQuery({
    queryKey: ['gallery', 'admin'],
    queryFn: () => galleryApi.adminList(),
    select: (res) => res.data.items,
  });
}

export function useAdminGalleryItem(id) {
  const { data: items, isLoading } = useAdminGalleryItems();
  return { item: items?.find((i) => i._id === id), isLoading };
}

export function useAdminGalleryLikes() {
  return useQuery({
    queryKey: ['gallery', 'admin', 'likes'],
    queryFn: () => galleryApi.adminLikes(),
    select: (res) => res.data.likes,
  });
}

export function useCreateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: galleryApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useUpdateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => galleryApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: galleryApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery'] }),
  });
}
