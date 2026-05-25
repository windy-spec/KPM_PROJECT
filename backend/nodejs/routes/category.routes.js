const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// 1. GET: Dành cho mọi user đã đăng nhập (FE cần gọi để lấy danh sách làm Dropdown filter)
router.get("/", authMiddleware, categoryController.getAll);

// 2. POST, PUT, DELETE: Khóa chặt, chỉ Admin được đụng vào
router.post("/", authMiddleware, adminMiddleware, categoryController.create);
router.put("/:id", authMiddleware, adminMiddleware, categoryController.update);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  categoryController.delete,
);

module.exports = router;
