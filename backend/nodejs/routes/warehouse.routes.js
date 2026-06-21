const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouse.controller");

// Các API Quản lý Tồn Kho (CRUD)
router.get("/inventory", warehouseController.getAllInventory);
router.get("/inventory/low-stock", warehouseController.getLowStock);
router.get("/inventory/:id", warehouseController.getInventoryById);
router.post("/inventory", warehouseController.createInventory);
router.put("/inventory/:id", warehouseController.updateInventoryManual);

// API Yêu cầu nhập hàng
router.post("/request-import", warehouseController.requestImportMaterials);

// Các API có sẵn trước đó
router.post(
  "/orders/:orderId/confirm-materials",
  warehouseController.confirmOrderMaterials,
);
router.post(
  "/orders/:orderId/complete-export",
  warehouseController.completeOrderExport,
);
router.delete("/inventory/:id", warehouseController.deleteInventory);
module.exports = router;
