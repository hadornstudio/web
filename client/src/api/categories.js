import axiosClient from './axiosClient';

export const categoriesApi = {
  list: () => axiosClient.get('/categories').then((r) => r.data),
  getBySlug: (slug) => axiosClient.get(`/categories/${slug}`).then((r) => r.data),

  adminList: () => axiosClient.get('/categories/admin/all').then((r) => r.data),
  create: (data) => axiosClient.post('/categories', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/categories/${id}`).then((r) => r.data),
};
