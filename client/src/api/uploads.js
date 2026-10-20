import axiosClient from './axiosClient';

export const uploadsApi = {
  // 3D model for the showroom (.splat / .glb); sent as the `model` field to the admin-only /uploads/model route.
  uploadModel: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('model', file);
    return axiosClient.post('/uploads/model', formData, { onUploadProgress }).then((r) => r.data);
  },

  upload: (file, onUploadProgress, endpoint = '/uploads') => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosClient
      .post(endpoint, formData, { onUploadProgress })
      .then((r) => r.data);
  },
};
