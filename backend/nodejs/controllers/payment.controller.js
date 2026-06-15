const paymentService = require("../services/payment.service");

class PaymentController {
  async checkoutMomo(req, res) {
    try {
      const { quotation_id, order_id } = req.body;
      const result = await paymentService.createMomoPayment(req.user.id, { quotation_id, order_id });
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async checkoutCash(req, res) {
    try {
      const { quotation_id, order_id } = req.body;
      const result = await paymentService.createCashPayment(req.user.id, { quotation_id, order_id });
      res.status(200).json({ success: true, message: "Đã ghi nhận thanh toán tiền mặt.", data: result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async checkoutVietQR(req, res) {
    try {
      const { quotation_id, order_id } = req.body;
      const result = await paymentService.createVietQRPayment(req.user.id, { quotation_id, order_id });
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async checkoutVnpay(req, res) {
    try {
      const { quotation_id, order_id } = req.body;
      const ipAddr = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
      const result = await paymentService.createVnpayPayment(req.user.id, { quotation_id, order_id, ipAddr });
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async momoWebhook(req, res) {
    try {
      await paymentService.handleMomoWebhook(req.body);
      res.status(204).send();
    } catch (e) {
      console.error("Lỗi Webhook MoMo:", e.message);
      res.status(400).json({ message: "Webhook Error" });
    }
  }

  async vnpayIpn(req, res) {
    try {
      const vnp_Params = req.query; 
      const result = await paymentService.handleVnpayIpn(vnp_Params);
      res.status(200).json(result); 
    } catch (e) {
      console.error("Lỗi Webhook VNPay:", e.message);
      res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  }
}

module.exports = new PaymentController();
