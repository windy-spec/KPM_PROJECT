const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotation.controller");

// ========================================================
// 1. CÁC API TĨNH (Phải đặt lên trên cùng để không bị lỗi)
// ========================================================
router.get("/", quotationController.getAll);
router.post("/calculate", quotationController.calculateBulk);
router.post("/calculate-realtime", quotationController.calculateRealtime);
router.post("/favorite", quotationController.saveFavorite);

// ========================================================
// 2. CÁC API ĐỘNG CHỨA :id (Bắt buộc phải nằm ở dưới)
// ========================================================
router.get("/:id", quotationController.getById);
router.put("/:id/status", quotationController.updateStatus);
router.post("/:id/attachments", quotationController.addAttachment); // API lưu link bản vẽ
router.delete("/:id", quotationController.delete);

module.exports = router;
