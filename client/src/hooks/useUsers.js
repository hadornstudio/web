import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';

export function useRecommendations() {
  return useQuery({
    queryKey: ['users', 'me', 'recommendations'],
    queryFn: () => usersApi.getRecommendations(),
    select: (res) => res.data,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: usersApi.updatePreferences,
    onSuccess: (res) => {
      updateUser(res.data.user);
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'recommendations'] });
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => usersApi.adminList(),
    select: (res) => res.data.users,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => usersApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => usersApi.updateStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
