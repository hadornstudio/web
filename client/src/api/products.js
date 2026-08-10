import axiosClient from './axiosClient';

export const productsApi = {
  list: (params) => axiosClient.get('/products', { params }).then((r) => r.data),
  featured: () => axiosClient.get('/products/featured').then((r) => r.data),
  getBySlug: (slug) => axiosClient.get(`/products/${slug}`).then((r) => r.data),
  related: (id) => axiosClient.get(`/products/${id}/related`).then((r) => r.data),

  adminList: () => axiosClient.get('/products/admin/all').then((r) => r.data),
  create: (data) => axiosClient.post('/products', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/products/${id}`).then((r) => r.data),
};
