const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { uploadDrawing } = require("../middlewares/upload.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
const authMiddleware = require("../middlewares/auth.middleware");
// API Chat AI: POST /api/ai/chat
router.post("/chat", optionalAuth, aiController.chat);
// API Phân tích bản vẽ bằng Vision: POST /api/ai/analyze-drawing
router.post("/analyze-drawing", optionalAuth,aiController.analyze);
router.post(
  "/upload-drawing",
  uploadDrawing.single("image"),
  aiController.uploadDrawingImage,
);
// API Lấy danh sách lịch sử chat
router.get("/sessions", authMiddleware, aiController.getSessions);
// API Lấy chi tiết lịch sử một phiên chat
router.get("/sessions/:id", authMiddleware, aiController.getSessionDetails);
module.exports = router;
