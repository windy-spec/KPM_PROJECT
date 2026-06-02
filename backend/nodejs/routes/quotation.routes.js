const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotation.controller");

// Ở đây tôi tạm thời chưa bọc authMiddleware để bro dễ test trên Postman.
// Sau này ráp vào app thật, nếu cần bảo mật thì bro kẹp authMiddleware vào nhé.

// API 1: Tính toán và tạo báo giá mới
router.post("/calculate", quotationController.calculateQuotation);

module.exports = router;
