const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// TẤT CẢ API GIỎ HÀNG ĐỀU YÊU CẦU ĐĂNG NHẬP (authMiddleware)
router.get("/", authMiddleware, cartController.getCart);
router.post("/add", authMiddleware, cartController.addToCart);
router.put("/items/:id", authMiddleware, cartController.updateQuantity);
router.delete("/items/:id", authMiddleware, cartController.removeItem);

// API Gửi yêu cầu Xưởng
router.post("/submit", authMiddleware, cartController.submitCart);

module.exports = router;
