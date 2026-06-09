import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeRequests = 0;

const updateLoadingState = (isLoading) => {
  if (isLoading) {
    activeRequests++;
    if (activeRequests === 1) {
      window.dispatchEvent(new CustomEvent('api-loading', { detail: { isLoading: true } }));
    }
  } else {
    activeRequests--;
    if (activeRequests <= 0) {
      activeRequests = 0;
      window.dispatchEvent(new CustomEvent('api-loading', { detail: { isLoading: false } }));
    }
  }
};

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (!config.headers['X-No-Loading']) {
    updateLoadingState(true);
  }

  return config;
}, (error) => {
  updateLoadingState(false);
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.config && !response.config.headers['X-No-Loading']) {
      updateLoadingState(false);
    }
    return response;
  },
  (error) => {
    if (error.config && !error.config.headers['X-No-Loading']) {
      updateLoadingState(false);
    }
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