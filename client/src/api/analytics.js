import axiosClient from './axiosClient';

export const analyticsApi = {
  overview: (days) => axiosClient.get('/analytics/overview', { params: { days } }).then((r) => r.data),
};
