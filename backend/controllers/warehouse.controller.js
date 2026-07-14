const warehouseService = require("../services/warehouse.service");
const PdfService = require("../services/pdf.service");

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
      if (global.io && result.order?.user_id) {
        global.io.to(`room_user_${result.order.user_id}`).emit("orderStatusUpdated", { orderId: req.params.orderId, status: "warehouse_received" });
        global.io.to("room_admin").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "warehouse_received" });
        global.io.to("room_warehouse").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "warehouse_received" });
      }
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async confirmSufficientStock(req, res) {
    try {
      const result = await warehouseService.confirmSufficientStock(req.params.orderId);
      if (global.io && result.order?.user_id) {
        global.io.to(`room_user_${result.order.user_id}`).emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_ready" });
        global.io.to("room_admin").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_ready" });
        global.io.to("room_warehouse").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_ready" });
      }
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
      if (global.io && result.order?.user_id) {
        global.io.to(`room_user_${result.order.user_id}`).emit("orderStatusUpdated", { orderId: req.params.orderId, status: "out_of_stock" });
        global.io.to("room_admin").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "out_of_stock" });
        global.io.to("room_warehouse").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "out_of_stock" });
        global.io.to("room_admin").emit("new_import_request", { orderId: req.params.orderId }); // Notify admin to check import
      }
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async completeImportAndReady(req, res) {
    try {
      const result = await warehouseService.completeImportAndReady(req.params.orderId);
      if (global.io && result.order?.user_id) {
        global.io.to(`room_user_${result.order.user_id}`).emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_ready" });
        global.io.to("room_admin").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_ready" });
        global.io.to("room_warehouse").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_ready" });
      }
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async startProduction(req, res) {
    try {
      const result = await warehouseService.startProduction(req.params.orderId);
      if (global.io && result.order?.user_id) {
        global.io.to(`room_user_${result.order.user_id}`).emit("orderStatusUpdated", { orderId: req.params.orderId, status: "producing" });
        global.io.to("room_admin").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "producing" });
        global.io.to("room_warehouse").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "producing" });
      }
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async completeProduction(req, res) {
    try {
      const result = await warehouseService.completeProduction(req.params.orderId);
      if (global.io && result.order?.user_id) {
        global.io.to(`room_user_${result.order.user_id}`).emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_completed" });
        global.io.to("room_admin").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_completed" });
        global.io.to("room_warehouse").emit("orderStatusUpdated", { orderId: req.params.orderId, status: "production_completed" });
      }
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

  async getExportHistory(req, res) {
    try {
      const data = await warehouseService.getExportHistory();
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
      
      // Bắn Socket báo Admin có yêu cầu mới
      if (global.io) {
        global.io.to("room_admin").emit("new_import_request", result);
      }

      res.status(200).json({
        success: true,
        message: "Đã gửi yêu cầu nhập hàng!",
        data: result,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async confirmImportRequest(req, res) {
    try {
      const { actualQuantity } = req.body;
      const result = await warehouseService.confirmImportRequest(req.params.id, parseFloat(actualQuantity));
      if (global.io) {
        global.io.to("room_admin").emit("import_request_received", result);
      }
      res.status(200).json({
        success: true,
        message: "Đã nhập kho thành công",
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
  async generateExportPDF(req, res) {
    try {
      const { orderId } = req.params;
      const missingMaterials = await warehouseService.getMissingMaterialsForPDF(orderId);
      if (missingMaterials.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng này không bị thiếu vật tư nào!",
        });
      }
      const pdfBuffer = await PdfService.generateWarehousePDF(missingMaterials);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=phieu-thieu-vat-tu_${orderId}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Lỗi khi tạo PDF:", error);
      res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi tạo PDF." });
    }
  }

  async generateInventoryPDF(req, res) {
    try {
      const { selectedIds, reportType } = req.body;
      const inventories = await warehouseService.getInventoryForPDF(selectedIds);
      if (!inventories || inventories.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dữ liệu tồn kho nào để xuất PDF!",
        });
      }
      
      let pdfBuffer;
      let filename = `bao-cao-ton-kho_${Date.now()}.pdf`;

      if (reportType === 'LEFTOVER') {
        pdfBuffer = await PdfService.generateLeftoverReportPDF(inventories);
        filename = `bao-cao-vat-tu-thua_${Date.now()}.pdf`;
      } else {
        pdfBuffer = await PdfService.generateInventoryReportPDF(inventories);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${filename}`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Lỗi khi tạo PDF Báo cáo tồn kho:", error);
      res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi khi tạo báo cáo PDF.",
      });
    }
  }
}

module.exports = new WarehouseController();
