const quotationService = require("../services/quotation.service");
const pdfService = require("../services/pdf.service");
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
  async calculateRealtime(req, res) {
    try {
      const result = await quotationService.calculateRealtime(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async saveFavorite(req, res) {
    try {
      // Trong thực tế, user_id sẽ lấy từ token: req.user.id. Tạm thời lấy từ body
      const user_id = req.user?.id || req.body.user_id;
      const data = { ...req.body, user_id };

      const result = await quotationService.saveFavorite(data);
      res.status(201).json({
        success: true,
        message: "Đã lưu vào danh sách yêu thích!",
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async requestCustomQuote(req, res) {
    try {
      const user_id = req.user?.id || req.body.user_id;
      const data = { ...req.body, user_id };

      const result = await quotationService.requestCustomQuote(data);
      res.status(201).json({
        success: true,
        message: "Gửi yêu cầu báo giá thành công!",
        data: result,
      });
    } catch (e) {
      if (e.message === "PROFILE_INCOMPLETE") {
        return res.status(400).json({
          success: false,
          code: "PROFILE_INCOMPLETE",
          message:
            "Vui lòng cập nhật Số điện thoại và Địa chỉ trước khi gửi yêu cầu.",
        });
      }
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async getUserQuotations(req, res) {
    try {
      const user_id = req.user?.id || req.query.user_id;
      const statuses = req.query.statuses ? req.query.statuses.split(",") : [];

      const result = await quotationService.getUserQuotations(
        user_id,
        statuses,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async approveQuoteRequest(req, res) {
    try {
      const result = await quotationService.approveQuoteRequest(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        success: true,
        message: "Đã duyệt và gửi báo giá cho khách hàng!",
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async userNegotiate(req, res) {
    try {
      const { price } = req.body;
      const result = await quotationService.userNegotiate(
        req.params.id,
        req.user.id,
        price,
      );
      res.status(200).json({
        success: true,
        message: "Đã gửi mức giá đề xuất của bạn cho xưởng!",
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async adminFinalDecision(req, res) {
    try {
      const { status } = req.body;
      const result = await quotationService.adminFinalDecision(
        req.params.id,
        status,
      );
      res.status(200).json({
        success: true,
        message: "Đã chốt trạng thái báo giá thành công!",
        data: result,
      });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
  async exportPdf(req, res) {
    try {
      const quotation = await quotationService.getQuotationById(req.params.id);
      const pdfBuffer = await pdfService.generateQuotationPDF(quotation);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=bao-gia-${req.params.id}.pdf`,
      );
      res.status(200).send(pdfBuffer);
    } catch (e) {
      console.error("Lỗi xuất PDF:", e);
      res.status(500).json({ success: false, message: e.message });
    }
  }
}
module.exports = new QuotationController();
