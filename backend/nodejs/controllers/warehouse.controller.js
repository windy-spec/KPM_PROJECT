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
        message: result.message,
      });
    } catch (error) {
      console.error("Lỗi xuất kho:", error);

      // Kiểm tra xem lỗi này có phải là do "Thiếu vật tư" (có gắn cờ từ Service) hay không
      if (error.isMissingMaterialError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          missing_list: error.missingList, // Trả về cho FE vẽ bảng báo cáo đỏ
        });
      }

      // Các lỗi khác (Không tìm thấy đơn hàng, lỗi DB...)
      res.status(400).json({
        success: false,
        message: error.message || "Đã xảy ra lỗi hệ thống!",
      });
    }
  }

  async completeOrderExport(req, res) {
    try {
      const { orderId } = req.params;
      const result = await warehouseService.completeOrderExport(orderId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Đã xảy ra lỗi hệ thống!",
      });
    }
  }
  // ==========================================
  // CÁC HÀM ĐIỀU HƯỚNG TRẠNG THÁI ĐƠN HÀNG MỚI
  // ==========================================
  async receiveOrder(req, res) {
    try {
      const result = await warehouseService.receiveOrder(req.params.orderId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async confirmSufficientStock(req, res) {
    try {
      const result = await warehouseService.confirmSufficientStock(req.params.orderId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      if (error.isMissingMaterialError) {
        return res.status(400).json({ success: false, message: error.message, missing_list: error.missingList });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async reportOutOfStock(req, res) {
    try {
      const result = await warehouseService.reportOutOfStock(req.params.orderId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async completeImportAndReady(req, res) {
    try {
      const result = await warehouseService.completeImportAndReady(req.params.orderId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async completeProduction(req, res) {
    try {
      const result = await warehouseService.completeProduction(req.params.orderId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // --- QUẢN LÝ TỒN KHO (CRUD) ---
  async getAllInventory(req, res) {
    try {
      const data = await warehouseService.getAllInventory();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLowStock(req, res) {
    try {
      const data = await warehouseService.getLowStock();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getInventoryById(req, res) {
    try {
      const data = await warehouseService.getInventoryById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createInventory(req, res) {
    try {
      const data = await warehouseService.createInventory(req.body);
      res
        .status(201)
        .json({ success: true, message: "Tạo tồn kho thành công", data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateInventoryManual(req, res) {
    try {
      const data = await warehouseService.updateInventoryManual(
        req.params.id,
        req.body,
      );
      res
        .status(200)
        .json({ success: true, message: "Cập nhật tồn kho thành công", data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // --- YÊU CẦU NHẬP HÀNG ---

  async requestImportMaterials(req, res) {
    try {
      const result = await warehouseService.requestImportMaterials(req.body);
      res.status(200).json({
        success: true,
        message: "Đã gửi yêu cầu nhập hàng!",
        data: result,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async deleteInventory(req, res) {
    try {
      const result = await warehouseService.deleteInventory(req.params.id);
      res
        .status(200)
        .json({
          success: true,
          message: "Xoá tồn kho thành công",
          data: result,
        });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
module.exports = new WarehouseController();
