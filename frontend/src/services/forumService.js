import axios from "axios";

// Đổi API URL dựa theo config của KPM (hoặc hardcode cho tiện test)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Cấu hình axios với token (giả sử dùng JWT token trong localStorage)
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const forumService = {
  // Public
  getPublicPosts: async (params) => {
    const response = await axios.get(`${API_URL}/forum/public`, { params });
    return response.data;
  },
  
  getPostDetail: async (id) => {
    // API public có thể dùng chung getPostById, ta dùng public cho an toàn
    const response = await axios.get(`${API_URL}/forum/public/${id}`);
    return response.data;
  },

  // Admin
  getAdminPosts: async (params) => {
    const response = await axios.get(`${API_URL}/forum/admin`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  generatePost: async (hashtags = []) => {
    const response = await axios.post(`${API_URL}/forum/admin/generate`, { hashtags }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updatePostStatus: async (id, status) => {
    const response = await axios.put(`${API_URL}/forum/admin/${id}`, { status }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updatePost: async (id, data) => {
    const response = await axios.put(`${API_URL}/forum/admin/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default forumService;
