const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const upload = require("../middlewares/upload.middleware"); // Gọi lính gác Cloudinary

// 1. GET: Dành cho mọi user đã đăng nhập (để show lên bảng)
router.get("/", authMiddleware, productController.getAll);

// 2. POST, PUT, DELETE: Khóa chặt, chỉ Admin được đụng vào
router.post("/", authMiddleware, adminMiddleware, productController.create);
router.put("/:id", authMiddleware, adminMiddleware, productController.update);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.delete,
);

// 3. UPLOAD ẢNH: Phải là Admin và bắt buộc key file gửi lên là "image"
router.post(
  "/:id/images",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  productController.uploadImage,
);
router.get("/:id", productController.getById);
module.exports = router;
