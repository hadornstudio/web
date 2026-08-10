import axiosClient from './axiosClient';

export const authApi = {
  register: (data) => axiosClient.post('/auth/register', data).then((r) => r.data),
  login: (data) => axiosClient.post('/auth/login', data).then((r) => r.data),
  google: (credential) => axiosClient.post('/auth/google', { credential }).then((r) => r.data),
  me: () => axiosClient.get('/auth/me').then((r) => r.data),
  logout: () => axiosClient.post('/auth/logout').then((r) => r.data),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, password) =>
    axiosClient.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data),
};
