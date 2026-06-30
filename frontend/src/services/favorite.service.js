import apiClient from './apiClient';

export const favoriteService = {
  toggleFavorite(productId) {
    return apiClient.post('/favorites/toggle', { product_id: productId });
  },
  getUserFavorites() {
    return apiClient.get('/favorites');
  },
  checkFavorite(productId) {
    return apiClient.get(`/favorites/check/${productId}`);
  },
  removeFavorite(id) {
    return apiClient.delete(`/favorites/${id}`);
  }
};
