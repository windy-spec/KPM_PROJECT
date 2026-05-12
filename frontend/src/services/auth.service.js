import apiClient from './apiClient';

export const authService = {
  getMe() {
    return apiClient.get('/auth/me');
  },

  register(data) {
    return apiClient.post('/auth/register', data);
  },

  verifyOtp(data) {
    return apiClient.post('/auth/verify-otp', data);
  },

  login(data) {
    return apiClient.post('/auth/login', data);
  },

  forgotPassword(data) {
    return apiClient.post('/auth/forgot-password', data);
  },

  resetPassword(data) {
    return apiClient.post('/auth/reset-password', data);
  },

  logout() {
    return apiClient.post('/auth/logout');
  },

  changePassword(data) {
    return apiClient.put('/auth/change-password', data);
  },

  updateProfile(data) {
    return apiClient.put('/auth/profile', data);
  },
};