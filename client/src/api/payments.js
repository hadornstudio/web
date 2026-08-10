import axiosClient from './axiosClient';

export const paymentsApi = {
  initialize: (data) => axiosClient.post('/payments/initialize', data).then((r) => r.data),
};
