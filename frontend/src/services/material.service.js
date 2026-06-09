import apiClient from './apiClient';

export const materialService = {
  getMaterials() {
    return apiClient.get('/materials');
  },
  getThicknesses() {
    return apiClient.get('/material-thickness');
  },
  getPaints() {
    return apiClient.get('/paint-types');
  },
  getLaborRates() {
    return apiClient.get('/labor/rates');
  }
};