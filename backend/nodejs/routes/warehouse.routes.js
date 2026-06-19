const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouse.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// Kho xác nhận xuất hàng theo orderId
router.post("/confirm-order/:orderId", authenticateToken, warehouseController.confirmOrderMaterials);

module.exports = router;
