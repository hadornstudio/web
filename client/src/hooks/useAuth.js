import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const { user, token, isAuthenticated, login: setSession, logout: clearSession } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => setSession(res.data.user, res.data.token),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => setSession(res.data.user, res.data.token),
  });

  const googleMutation = useMutation({
    mutationFn: authApi.google,
    onSuccess: (res) => setSession(res.data.user, res.data.token),
  });

  const logout = () => {
    authApi.logout().catch(() => {});
    clearSession();
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login: loginMutation.mutateAsync,
    loginStatus: loginMutation,
    register: registerMutation.mutateAsync,
    registerStatus: registerMutation,
    googleAuth: googleMutation.mutateAsync,
    googleAuthStatus: googleMutation,
    logout,
  };
}
