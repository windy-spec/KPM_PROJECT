const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/admin.middleware");

// Route cho User gửi góp ý
router.post("/", authenticateToken, feedbackController.createFeedback);

// Route cho Admin xem toàn bộ danh sách
router.get("/", authenticateToken, isAdmin, feedbackController.getAllFeedbacks);

// [NEW] Xem chi tiết 1 góp ý
router.get("/:id", authenticateToken, feedbackController.getFeedbackById);

// [NEW] Sửa góp ý
router.put("/:id", authenticateToken, feedbackController.updateFeedback);

// [NEW] Xóa góp ý (Thường chỉ Admin mới được xóa)
router.delete("/:id", authenticateToken, isAdmin, feedbackController.deleteFeedback);

module.exports = router;
