import axiosClient from './axiosClient';

export const galleryApi = {
  list: (params) => axiosClient.get('/gallery', { params }).then((r) => r.data),
  myLikedIds: () => axiosClient.get('/gallery/mine/liked').then((r) => r.data),
  toggleLike: (id) => axiosClient.post(`/gallery/${id}/like`).then((r) => r.data),

  adminList: () => axiosClient.get('/gallery/admin/all').then((r) => r.data),
  adminLikes: () => axiosClient.get('/gallery/admin/likes').then((r) => r.data),
  create: (data) => axiosClient.post('/gallery', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/gallery/${id}`, data).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/gallery/${id}`).then((r) => r.data),
};
