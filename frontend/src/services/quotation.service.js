import apiClient from './apiClient';

export const quotationService = {
  calculateRealtime(data) {
    return apiClient.post('/quotations/calculate-realtime', data);
  },
  calculateBulk(data) {
    return apiClient.post('/quotations/calculate', data); // Đã sửa thành /calculate để khớp với Backend route
  },
  estimateCost(data) {
    return apiClient.post('/quotations/calculate', { ...data, is_estimate: true });
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
  },
  saveDraft(id, payload) {
    return apiClient.put(`/quotations/${id}/save-draft`, payload);
  }
};
