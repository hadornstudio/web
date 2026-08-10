import axiosClient from './axiosClient';

export const reviewsApi = {
  listForProduct: (productId, params) =>
    axiosClient.get(`/reviews/product/${productId}`, { params }).then((r) => r.data),
  create: (productId, data) => axiosClient.post(`/reviews/product/${productId}`, data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/reviews/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/reviews/${id}`).then((r) => r.data),
};
