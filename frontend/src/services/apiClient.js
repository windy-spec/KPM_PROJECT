import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Access token hết hạn hoặc không hợp lệ
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Dispatch một CustomEvent để React bắt được và vẽ giao diện Modal đẹp hơn
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;