import axiosClient from './axiosClient';

export const inquiriesApi = {
  create: (data) => axiosClient.post('/inquiries', data).then((r) => r.data),

  adminList: () => axiosClient.get('/inquiries').then((r) => r.data),
  updateStatus: (id, status) => axiosClient.patch(`/inquiries/${id}/status`, { status }).then((r) => r.data),
};
