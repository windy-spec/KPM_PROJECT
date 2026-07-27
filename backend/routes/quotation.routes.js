const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotation.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// ========================================================
// 1. CÁC API TĨNH (Phải đặt lên trên cùng để không bị lỗi)
// ========================================================
router.delete("/deleteQuo/:id", quotationController.deleteQuo);
router.get("/", quotationController.getAll);
router.post("/calculate", quotationController.calculateBulk);
router.post("/calculate-realtime", quotationController.calculateRealtime);
router.post("/favorite", authenticateToken, quotationController.saveFavorite);
router.post(
  "/request",
  authenticateToken,
  quotationController.requestCustomQuote,
);
router.get("/user", authenticateToken, quotationController.getUserQuotations);

// ========================================================
// 2. CÁC API ĐỘNG CHỨA :id (Bắt buộc phải nằm ở dưới)
// ========================================================
router.get("/countquo", quotationController.countQuo); // API đếm số lượng báo giá theo tháng
router.get("/:id", quotationController.getById);
router.put("/:id/status", quotationController.updateStatus);
router.put("/:id/approve", quotationController.approveQuoteRequest);
router.put(
  "/:id/negotiate",
  authenticateToken,
  quotationController.userNegotiate,
);
router.put(
  "/:id/final-decision",
  authenticateToken,
  quotationController.adminFinalDecision,
);
router.post("/:id/attachments", quotationController.addAttachment); // API lưu link bản vẽ
router.delete("/:id", quotationController.delete);
router.post("/:id/update", quotationController.updateStatus); // API cập nhật báo giá
module.exports = router;
