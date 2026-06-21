const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { uploadDrawing } = require("../middlewares/upload.middleware");
const optionalAuth = require("../middlewares/optionalAuth.middleware");
// API Chat AI: POST /api/ai/chat
router.post("/chat", optionalAuth, aiController.chat);
// API Phân tích bản vẽ bằng Vision: POST /api/ai/analyze-drawing
router.post("/analyze-drawing", aiController.analyze);
router.post(
  "/upload-drawing",
  uploadDrawing.single("image"),
  aiController.uploadDrawingImage,
);
module.exports = router;
