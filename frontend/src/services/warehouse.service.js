import apiClient from "./apiClient";

const warehouseService = {
    /**
     * ==========================================
     * 1. NGHIỆP VỤ XỬ LÝ ĐƠN HÀNG (CÓ SẴN ĐÃ ĐỒNG BỘ)
     * ==========================================
     */

    /**
     * Gọi API xác nhận xuất vật tư cho đơn hàng theo orderId
     * @param {string|number} orderId - ID của đơn hàng cần xuất kho
     * @returns {Promise} Axios Response
     * Backend route: POST /warehouse/orders/:orderId/confirm-materials
     */
    confirmOrderMaterials(orderId) {
        // Đã sửa lại URL khớp chính xác với route: router.post("/orders/:orderId/confirm-materials", ...) ở Backend
        return apiClient.post(`/warehouse/orders/${orderId}/confirm-materials`);
    },

    completeOrderExport(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/complete-export`);
    },

    receiveOrder(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/receive`);
    },
    confirmSufficientStock(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/confirm-stock`);
    },
    reportOutOfStock(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/out-of-stock`);
    },
    completeImportAndReady(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/import-ready`);
    },
    completeProduction(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/complete-production`);
    },

    /**
     * ==========================================
     * 2. DANH MỤC QUẢN LÝ TỒN KHO (CRUD)
     * ==========================================
     */

    /**
     * Lấy toàn bộ danh sách hàng tồn kho thực tế
     * Backend route: GET /warehouse/inventory
     */
    getAllInventory() {
        return apiClient.get("/warehouse/inventory");
    },

    /**
     * Lấy thông tin chi tiết của một mã tồn kho cụ thể
     * @param {string|number} id - ID bản ghi tồn kho
     * Backend route: GET /warehouse/inventory/:id
     */
    getInventoryById(id) {
        return apiClient.get(`/warehouse/inventory/${id}`);
    },

    /**
     * Khởi tạo bản ghi tồn kho mới cho vật tư
     * @param {Object} data - { material_id, quantity, ... }
     * Backend route: POST /warehouse/inventory
     */
    createInventory(data) {
        return apiClient.post("/warehouse/inventory", data);
    },

    /**
     * Điều chỉnh, cập nhật số lượng tồn kho thủ công (Ghi log tăng/giảm)
     * @param {string|number} id - ID bản ghi tồn kho cần sửa
     * @param {Object} data - { quantity, note, quantityChange, ... }
     * Backend route: PUT /warehouse/inventory/:id
     */
    updateInventoryManual(id, data) {
        return apiClient.put(`/warehouse/inventory/${id}`, data);
    },

    /**
     * Xóa hoàn toàn một mã tồn kho khỏi hệ thống
     * @param {string|number} id - ID bản ghi tồn kho cần xóa
     * Backend route: DELETE /warehouse/inventory/:id
     */
    deleteInventory(id) {
        return apiClient.delete(`/warehouse/inventory/${id}`);
    },

    /**
     * ==========================================
     * 3. NGHIỆP VỤ YÊU CẦU NHẬP HÀNG
     * ==========================================
     */

    /**
     * Tạo và gửi yêu cầu nhập thêm cấp vật tư mới về kho
     * @param {Object} payload - { note, ... }
     * Backend route: POST /warehouse/request-import
     */
    requestImportMaterials(payload) {
        return apiClient.post("/warehouse/request-import", payload);
    }
};

export default warehouseService;