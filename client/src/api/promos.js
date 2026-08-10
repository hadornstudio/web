import axiosClient from './axiosClient';

export const promosApi = {
  adminList: () => axiosClient.get('/promos').then((r) => r.data),
  create: (data) => axiosClient.post('/promos', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/promos/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/promos/${id}`).then((r) => r.data),
  announce: (id) => axiosClient.post(`/promos/${id}/announce`).then((r) => r.data),
};
