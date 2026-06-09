import apiClient from './apiClient';

export const quotationService = {
  calculateRealtime(data) {
    return apiClient.post('/quotations/calculate-realtime', data);
  },
  calculateBulk(data) {
    return apiClient.post('/quotations/calculate-bulk', data);
  },
  saveFavorite(data) {
    return apiClient.post('/quotations/save-favorite', data);
  }
};
