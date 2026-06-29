const express = require("express");
const router = express.Router();
const drawingController = require("../controllers/drawing.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// === PUBLIC / USER ===
// GET /api/drawings/product/:productId - Lấy bản vẽ theo sản phẩm
router.get("/product/:productId", drawingController.getDrawingsByProduct);

// GET /api/drawings/:id - Lấy chi tiết 1 bản vẽ
router.get("/:id", drawingController.getDrawingById);

// === ADMIN ONLY ===
// POST /api/drawings - Tạo bản vẽ mới
router.post("/", authenticateToken, drawingController.createDrawing);

// PUT /api/drawings/:id - Cập nhật bản vẽ
router.put("/:id", authenticateToken, drawingController.updateDrawing);

// DELETE /api/drawings/:id - Xóa bản vẽ
router.delete("/:id", authenticateToken, drawingController.deleteDrawing);

module.exports = router;
