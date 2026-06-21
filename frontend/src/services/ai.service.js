import apiClient from "./apiClient";

const aiService = {
  chat: async (message, sessionId, mode) => {
    // Để X-No-Loading để không block UI chính khi đang chat
    const response = await apiClient.post(
      "/ai/chat",
      { message, sessionID: sessionId, mode },
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
  analyzeDrawing: async (imageUrl, messageId) => {
    const response = await apiClient.post(
      "/ai/analyze-drawing",
      { imageUrl, messageId },
      { headers: { "X-No-Loading": true } }
    );
    return response.data;
  },
};

export default aiService;
