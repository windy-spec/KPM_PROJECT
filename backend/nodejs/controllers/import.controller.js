const importService = require("../services/import.service");

class ImportController {
  // 1. Download file mẫu
  async downloadTemplate(req, res) {
    try {
      const workbook = await importService.generateProductTemplate();

      // Cấu hình Header để trình duyệt tự hiểu đây là file tải về
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "KPM_Import_Product.xlsx",
      );

      // Ghi file thẳng ra luồng response trả về cho client
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
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

      // Đẩy buffer của file nhận được vào Service xử lý
      const result = await importService.processImportExcel(req.file.buffer);

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

      // Cấu hình để trình duyệt tải file Excel về
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      // Đặt tên file có đính kèm mã lô để Admin dễ phân biệt
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
}

module.exports = new ImportController();
