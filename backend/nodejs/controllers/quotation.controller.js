const quotationService = require("../services/quotation.service");

class QuotationController {
  // POST: /api/quotations/calculate
  async calculateQuotation(req, res) {
    try {
      // Lấy toàn bộ thông số khách hàng/FE gửi lên từ body
      const payload = req.body;

      // Gọi vào lõi Pricing Engine để bóc tách và tính giá
      const result =
        await quotationService.calculateAndCreateQuotation(payload);

      // Tính xong thì trả về cho FE show lên giao diện
      res.status(201).json({
        success: true,
        message: "Bóc tách khối lượng và tạo báo giá thành công!",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new QuotationController();
