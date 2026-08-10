import axiosClient from './axiosClient';

export const shippingApi = {
  localRates: () => axiosClient.get('/shipping/local').then((r) => r.data),
  quote: (data) => axiosClient.post('/shipping/quote', data).then((r) => r.data),

  adminLocalRates: () => axiosClient.get('/shipping/local/admin').then((r) => r.data),
  updateLocalRates: (rates) => axiosClient.put('/shipping/local', { rates }).then((r) => r.data),
  adminSettings: () => axiosClient.get('/shipping/settings').then((r) => r.data),
  updateSettings: (data) => axiosClient.put('/shipping/settings', data).then((r) => r.data),
};
