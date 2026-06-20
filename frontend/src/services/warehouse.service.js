import apiClient from "./apiClient";

const warehouseService = {
    /**
     * Gọi API xác nhận xuất vật tư cho đơn hàng
     * @param {string|number} orderId - ID của đơn hàng cần xuất kho
     * @returns {Promise} Axios Response
     */
    confirmOrderMaterials(orderId) {
        // Đảm bảo URL này khớp với cấu hình tiền tố (Prefix) route ở app.js / server.js phía Backend
        return apiClient.post(`/warehouse/confirm-order/${orderId}`);
    },
};

export default warehouseService;