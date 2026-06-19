const warehouseService = require("../services/warehouse.service");

class WarehouseController {
  async confirmOrderMaterials(req, res) {
    try {
      const { orderId } = req.params;
      
      // Gọi service xử lý logic
      const result = await warehouseService.confirmOrderMaterials(orderId);

      // Nếu Service chạy trơn tru, trả về 200 Thành công
      res.status(200).json({ 
          success: true, 
          message: result.message 
      });

    } catch (error) {
      console.error("Lỗi xuất kho:", error);

      // Kiểm tra xem lỗi này có phải là do "Thiếu vật tư" (có gắn cờ từ Service) hay không
      if (error.isMissingMaterialError) {
          return res.status(400).json({
              success: false,
              message: error.message,
              missing_list: error.missingList // Trả về cho FE vẽ bảng báo cáo đỏ
          });
      }

      // Các lỗi khác (Không tìm thấy đơn hàng, lỗi DB...)
      res.status(400).json({ 
          success: false, 
          message: error.message || "Đã xảy ra lỗi hệ thống!" 
      });
    }
  }
}

module.exports = new WarehouseController();