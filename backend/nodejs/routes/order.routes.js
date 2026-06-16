const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// Route xem danh sách đơn hàng (admin only, but we can secure it later)
router.get("/", authenticateToken, orderController.getAllOrders);

// Route xem danh sách đơn hàng của user hiện tại
router.get("/my-orders", authenticateToken, orderController.getMyOrders);

// Route xem chi tiết đơn hàng
router.get("/:id", authenticateToken, orderController.getOrderById);
router.post("/direct", authenticateToken, orderController.createDirect);
router.put(
  "/:id/checkout",
  authenticateToken,
  orderController.updateCheckoutInfo,
);
module.exports = router;
