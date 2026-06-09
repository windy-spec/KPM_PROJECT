import apiClient from './apiClient';

export const categoryService = {
  getCategories() {
    return apiClient.get('/categories');
  }
};
