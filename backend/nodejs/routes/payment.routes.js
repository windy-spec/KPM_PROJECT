const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// Các API tạo thanh toán (Cần đăng nhập)
router.post("/momo", authenticateToken, paymentController.checkoutMomo);
router.post("/cash", authenticateToken, paymentController.checkoutCash);
router.post("/vietqr", authenticateToken, paymentController.checkoutVietQR);
router.post("/vnpay", authenticateToken, paymentController.checkoutVnpay);
router.post("/cancel-deposit", authenticateToken, paymentController.cancelDeposit);

// Các API bắt Webhook/IPN (Không cần Auth để cổng thanh toán có thể gọi vào)
router.post("/momo-webhook", paymentController.momoWebhook); 
router.get("/vnpay-ipn", paymentController.vnpayIpn); // VNPay dùng method GET

module.exports = router;
