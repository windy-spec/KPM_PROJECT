import apiClient from './apiClient';

export const quotationService = {
  calculateRealtime(data) {
    return apiClient.post('/quotations/calculate-realtime', data);
  },
  calculateBulk(data) {
    return apiClient.post('/quotations/calculate-bulk', data);
  },
  saveFavorite(data) {
    return apiClient.post('/quotations/favorite', data);
  },
  requestCustomQuote(data) {
    return apiClient.post('/quotations/request', data);
  },
  getUserQuotations(statuses = []) {
    const query = statuses.length > 0 ? `?statuses=${statuses.join(',')}` : '';
    return apiClient.get(`/quotations/user${query}`);
  },
  approveQuoteRequest(id, data) {
    return apiClient.put(`/quotations/${id}/approve`, data);
  },
  getById(id) {
    return apiClient.get(`/quotations/${id}`);
  },
  updateStatus(id, status) {
    return apiClient.put(`/quotations/${id}/status`, { status });
  }
};
