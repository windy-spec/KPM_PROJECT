const express = require("express");
const router = express.Router();
const requestController = require("../controllers/material_request.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

router.post("/", authMiddleware, requestController.createRequest); // Kho gửi yêu cầu
router.get("/", authMiddleware, requestController.getAllRequests); // Admin/Kho lấy danh sách
router.put("/:id/approve", authMiddleware, adminMiddleware, requestController.approveRequest); // Admin duyệt mua hàng
router.put("/:id/receive", authMiddleware, requestController.receiveImport); // Kho nhận hàng và nhập kho

module.exports = router;
