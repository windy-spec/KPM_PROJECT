const quotationService = require("../services/quotation.service");

class QuotationController {
  async getAll(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: await quotationService.getAllQuotations(),
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getById(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: await quotationService.getQuotationById(req.params.id),
      });
    } catch (e) {
      res.status(404).json({ success: false, message: e.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái thành công!",
        data: await quotationService.updateStatus(req.params.id, status),
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async addAttachment(req, res) {
    try {
      res.status(201).json({
        success: true,
        message: "Đính kèm bản vẽ thành công!",
        data: await quotationService.addAttachment(req.params.id, req.body),
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async delete(req, res) {
    try {
      await quotationService.deleteQuotation(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Xóa báo giá thành công!" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  // Endpoint cho Pricing Engine
  async calculateBulk(req, res) {
    try {
      const result = await quotationService.calculateBulk(req.body);
      res.status(201).json({
        success: true,
        message: "Tính toán hàng loạt và tạo báo giá thành công!",
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}
module.exports = new QuotationController();
