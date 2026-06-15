import apiClient from './apiClient';

const userService = {
  getProfileStats: async () => {
    const response = await apiClient.get('/users/profile/stats');
    return response.data;
  }
};

export default userService;
