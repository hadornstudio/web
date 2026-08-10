import axiosClient from './axiosClient';

export const ordersApi = {
  create: (data) => axiosClient.post('/orders', data).then((r) => r.data),
  mine: () => axiosClient.get('/orders/mine').then((r) => r.data),
  getMine: (id) => axiosClient.get(`/orders/mine/${id}`).then((r) => r.data),

  adminList: (params) => axiosClient.get('/orders', { params }).then((r) => r.data),
  adminGet: (id) => axiosClient.get(`/orders/${id}`).then((r) => r.data),
  updateStatus: (id, data) => axiosClient.patch(`/orders/${id}/status`, data).then((r) => r.data),
};
