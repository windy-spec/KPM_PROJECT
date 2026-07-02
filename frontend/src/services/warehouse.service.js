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
    startProduction(orderId) {
        return apiClient.post(`/warehouse/orders/${orderId}/start-production`);
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
     * Lấy danh sách lịch sử phiếu xuất kho
     * Backend route: GET /warehouse/inventory/export-history
     */
    getExportHistory() {
        return apiClient.get("/warehouse/inventory/export-history");
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
    },

    /**
     * HÀM MỚI BỔ SUNG: Duyệt thực nhập kho và đồng bộ số lượng thực tế nhận từ FE
     * @param {string|number} requestId - ID của phiếu yêu cầu nhập hàng (material_import_requests)
     * @param {Object} payload - { actual_quantity, note }
     * Gắn trực tiếp vào API mà file component 'WarehouseMaterialRequestReceive' đang gọi
     */
    approveAndExecuteImport(requestId, payload) {
        return apiClient.put(`/warehouse/request-import/${requestId}/approve`, payload);
    },

    /**
     * BỔ SUNG MỚI (1): Xuất file PDF danh sách vật tư thiếu cho một đơn hàng cụ thể
     * @param {string|number} orderId - ID đơn hàng cần xuất PDF đối soát
     * Backend route: GET /warehouse/orders/:orderId/export-pdf
     */
    exportMissingMaterialsPDF(orderId) {
        return apiClient.get(`/warehouse/orders/${orderId}/export-pdf`, {
            responseType: "blob" // Nhận luồng dữ liệu file nhị phân từ Backend
        });
    },

    /**
     * BỔ SUNG MỚI (2): Xuất báo cáo PDF danh sách hàng tồn kho tùy chọn (Checkbox)
     * @param {Object} payload - { selectedIds: [id1, id2...] } (Mảng rỗng nếu muốn in toàn bộ kho)
     * Backend route: POST /warehouse/inventory/export-pdf
     */
    exportInventoryPDF(payload) {
        return apiClient.post("/warehouse/inventory/export-pdf", payload, {
            responseType: "blob" // Ép kiểu dữ liệu nhị phân thô để trình duyệt không parse thành JSON lỗi
        });
    },
};

export default warehouseService;