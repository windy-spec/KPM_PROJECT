const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const { upload } = require("../middlewares/upload.middleware"); // Gọi lính gác Cloudinary

// 1. GET: Public cho khách hàng vãng lai xem danh sách sản phẩm
router.get("/p1", productController.getALlp);
router.get("/p2", productController.getALlp2);
router.get("/filterPro", productController.filterPro);
router.get("/", productController.getAll);
router.get("/getProduct", productController.getProductsImages);
router.post("/search", productController.getProductContaint);
// 2. POST, PUT, DELETE: Khóa chặt, chỉ Admin được đụng vào
router.post("/", authMiddleware, adminMiddleware, productController.create);
router.put("/:id", authMiddleware, adminMiddleware, productController.update);
router.put("/updateProCus/:id",productController.updateProCus);
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
router.delete(
  "/:id/images/:imageId",
  authMiddleware,
  adminMiddleware,
  productController.deleteImage,
);
router.get("/:id", productController.getById);
router.delete("/:id/safe", productController.safeDelete);
module.exports = router;
