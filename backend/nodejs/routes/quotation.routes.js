const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotation.controller");

// Các API Quản lý Báo giá
router.get("/", quotationController.getAll);
router.get("/:id", quotationController.getById);
router.put("/:id/status", quotationController.updateStatus);
router.post("/:id/attachments", quotationController.addAttachment); // API lưu link bản vẽ
router.delete("/:id", quotationController.delete);
router.post("/calculate", quotationController.calculateBulk);
module.exports = router;
