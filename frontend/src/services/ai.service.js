import apiClient from "./apiClient";

const aiService = {
  chat: async (message, sessionId, mode) => {
    // Để X-No-Loading để không block UI chính khi đang chat
    const response = await apiClient.post(
      "/ai/chat",
      { message, sessionId, mode },
      { headers: { "X-No-Loading": true } }
    );
    return response.data;
  },
  uploadDrawing: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    // Để X-No-Loading true để ta tự quản lý UI loading riêng trong popup chat
    const response = await apiClient.post("/ai/upload-drawing", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-No-Loading": true,
      },
    });
    return response.data;
  },
  analyzeDrawing: async (imageUrl, sessionId) => {
    const response = await apiClient.post(
      "/ai/analyze-drawing",
      { imageUrl, sessionId },
      { headers: { "X-No-Loading": true } }
    );
    return response.data;
  },

  getSessions: async () => {
    try {
      const response = await apiClient.get("/ai/sessions");
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy danh sách lịch sử AI:", error);
      throw error;
    }
  },

  getSessionDetails: async (sessionId) => {
    try {
      const response = await apiClient.get(`/ai/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error("Lỗi lấy chi tiết phiên chat AI:", error);
      throw error;
    }
  }
};

export default aiService;
