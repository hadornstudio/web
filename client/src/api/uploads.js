import axiosClient from './axiosClient';

export const uploadsApi = {
  upload: (file, onUploadProgress, endpoint = '/uploads') => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosClient
      .post(endpoint, formData, { onUploadProgress })
      .then((r) => r.data);
  },
};
