const importService = require("../services/import.service");

class ImportController {
  // 1. Download file mẫu (Đảm bảo 100% file mới, không dính cache)
  async downloadTemplate(req, res) {
    try {
      console.log("🚀 ĐANG TẠO FILE EXCEL MỚI TỪ RAM...");
      const workbook = await importService.generateProductTemplate();

      // Ép trình duyệt KHÔNG ĐƯỢC CACHE (Quan trọng!)
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Cấu hình Header để trình duyệt tự hiểu đây là file tải về
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      // Đặt tên file kèm thời gian thực (Timestamp) để chống trùng tên tuyệt đối
      const timestamp = Date.now();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="KPM_Import_Product_${timestamp}.xlsx"`,
      );

      // Ghi file thẳng ra luồng response trả về cho client
      await workbook.xlsx.write(res);
      res.end();

      console.log(
        `✅ TẢI THÀNH CÔNG FILE: KPM_Import_Product_${timestamp}.xlsx`,
      );
    } catch (error) {
      console.error("❌ LỖI CONTROLLER TEMPLATE:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. Upload file Excel lên kiểm tra
  async uploadExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn file Excel để upload!",
        });
      }

      const result = await importService.processImportExcel(
        req.file.buffer,
        req.file.originalname,
      );

      res.status(200).json({
        success: true,
        message: `Đẩy file lên bảng đệm thành công! Đã xử lý ${result.total_rows} dòng.`,
        data: { batchId: result.batch_id },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 3. Xem chi tiết lô đệm
  async getBatch(req, res) {
    try {
      const { batchId } = req.params;
      const result = await importService.getBatchDetails(batchId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 4. Hủy lô hàng đệm
  async rejectBatch(req, res) {
    try {
      const { batchId } = req.params;
      await importService.rejectBatch(batchId);
      res
        .status(200)
        .json({ success: true, message: "Đã hủy lô nhập dữ liệu thành công!" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 5. Duyệt lô hàng đệm vào DB chính
  async approveBatch(req, res) {
    try {
      const { batchId } = req.params;
      await importService.approveBatch(batchId);
      res.status(200).json({
        success: true,
        message: "Duyệt lô hàng thành công! Dữ liệu đã được ghi nhận.",
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 6. Xuất file Excel chứa danh sách các dòng bị lỗi
  async exportErrors(req, res) {
    try {
      const { batchId } = req.params;
      const workbook = await importService.exportInvalidRows(batchId);

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="KPM_San_Pham_Loi_${batchId.split("-")[0]}.xlsx"`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 7. Xóa vật lý lô nhập liệu
  async deleteBatch(req, res) {
    try {
      const { batchId } = req.params;
      await importService.deleteBatch(batchId);
      res.status(200).json({
        success: true,
        message: "Đã xóa vĩnh viễn lô hàng và dữ liệu đệm!",
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 8. Lấy danh sách lô nhập
  async getAllBatches(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 200;
      const result = await importService.getAllBatches(limit);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ImportController();
