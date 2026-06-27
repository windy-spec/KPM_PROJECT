import apiClient from './apiClient';

const cartService = {
  getCart: async () => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  addToCart: async (data) => {
    const response = await apiClient.post('/cart/add', data);
    return response.data;
  },

  updateQuantity: async (itemId, quantity) => {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId) => {
    const response = await apiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  submitCart: async () => {
    const response = await apiClient.post('/cart/submit');
    return response.data;
  }
};

export default cartService;
