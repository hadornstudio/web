import axiosClient from './axiosClient';

export const couponsApi = {
  validate: (code, subtotal, items) => axiosClient.post('/coupons/validate', { code, subtotal, items }).then((r) => r.data),

  adminList: () => axiosClient.get('/coupons').then((r) => r.data),
  create: (data) => axiosClient.post('/coupons', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/coupons/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/coupons/${id}`).then((r) => r.data),
};
