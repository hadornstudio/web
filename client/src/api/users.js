import axiosClient from './axiosClient';

export const usersApi = {
  updateProfile: (data) => axiosClient.put('/users/me', data).then((r) => r.data),
  changePassword: (data) => axiosClient.put('/users/me/password', data).then((r) => r.data),

  listAddresses: () => axiosClient.get('/users/me/addresses').then((r) => r.data),
  addAddress: (data) => axiosClient.post('/users/me/addresses', data).then((r) => r.data),
  updateAddress: (id, data) => axiosClient.put(`/users/me/addresses/${id}`, data).then((r) => r.data),
  deleteAddress: (id) => axiosClient.delete(`/users/me/addresses/${id}`).then((r) => r.data),
  setDefaultAddress: (id) => axiosClient.patch(`/users/me/addresses/${id}/default`).then((r) => r.data),

  getWishlist: () => axiosClient.get('/users/me/wishlist').then((r) => r.data),
  addToWishlist: (productId) => axiosClient.post(`/users/me/wishlist/${productId}`).then((r) => r.data),
  removeFromWishlist: (productId) => axiosClient.delete(`/users/me/wishlist/${productId}`).then((r) => r.data),

  updatePreferences: (data) => axiosClient.put('/users/me/preferences', data).then((r) => r.data),
  getRecommendations: () => axiosClient.get('/users/me/recommendations').then((r) => r.data),

  adminList: () => axiosClient.get('/users').then((r) => r.data),
  updateRole: (id, role) => axiosClient.patch(`/users/${id}/role`, { role }).then((r) => r.data),
  updateStatus: (id, isActive) => axiosClient.patch(`/users/${id}/status`, { isActive }).then((r) => r.data),
};
