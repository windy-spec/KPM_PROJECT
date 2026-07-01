import apiClient from './apiClient';

const orderService = {
  getAllOrders: async (config = {}) => {
    const response = await apiClient.get('/orders', config);
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await apiClient.get('/orders/my-orders');
    return response.data;
  },

  updateOrderStatus: async (id, data) => {
    const response = await apiClient.put(`/orders/${id}/status`, data);
    return response.data;
  },

  getOrderTracking: async (id) => {
    const response = await apiClient.get(`/orders/${id}/tracking`);
    return response.data;
  },

  approveOrderAndRequestMaterials: async (orderId) => {
    const response = await apiClient.put(`/orders/${orderId}/approve`);
    return response.data;
  }
};

export default orderService;
