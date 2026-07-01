import axiosClient from "./apiClient";

export const materialRequestService = {
  // Lấy danh sách toàn bộ yêu cầu nhập vật tư
  getAllRequests: async () => {
    return await axiosClient.get("/material-requests");
  },

  // Tạo yêu cầu nhập kho (Dành cho Kho)
  createRequest: async (data) => {
    return await axiosClient.post("/material-requests", data);
  },

  // Duyệt yêu cầu mua hàng (Dành cho Admin)
  approveRequest: async (id) => {
    return await axiosClient.put(`/material-requests/${id}/approve`);
  },

  // Nhập kho thực tế (Dành cho Kho)
  receiveImport: async (id, actualQuantity) => {
    return await axiosClient.put(`/warehouse/import-requests/${id}/confirm`, { actualQuantity });
  },
};

export default materialRequestService;
