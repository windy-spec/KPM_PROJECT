import apiClient from './apiClient';

export const productService = {
  getProducts(params, config = {}) {
    return apiClient.get('/products', { params, ...config });
  },
  getProductById(id) {
    return apiClient.get(`/products/${id}`);
  }
};
