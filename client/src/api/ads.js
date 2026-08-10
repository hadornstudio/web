import axiosClient from './axiosClient';

export const adsApi = {
  list: (placement) => axiosClient.get('/ads', { params: { placement } }).then((r) => r.data),
  adminList: () => axiosClient.get('/ads/admin/all').then((r) => r.data),
  create: (data) => axiosClient.post('/ads', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/ads/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/ads/${id}`).then((r) => r.data),
};
