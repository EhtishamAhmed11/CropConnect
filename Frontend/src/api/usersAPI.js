import api from './axios';

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  updatePreferences: (data) => api.put('/users/preferences', data),
  getActivity: (params) => api.get('/users/activity', { params }),
  getStats: () => api.get('/users/stats'),
  deactivateAccount: (password) => api.delete('/users/account', { data: { password } }),
};