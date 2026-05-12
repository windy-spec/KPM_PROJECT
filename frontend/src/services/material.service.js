import apiClient from './apiClient';

export const materialService = {
  getMaterials() {
    return apiClient.get('/materials');
  },
};