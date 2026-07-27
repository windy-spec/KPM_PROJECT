const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// 1. GET: Dành cho mọi user (Public để FE làm Dropdown filter cho cả khách vãng lai)
router.get("/", categoryController.getAll);

// 2. POST, PUT, DELETE: Khóa chặt, chỉ Admin được đụng vào
router.post("/", authMiddleware, adminMiddleware, categoryController.create);
router.put("/:id", authMiddleware, adminMiddleware, categoryController.update);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  categoryController.delete,
);
router.post("/unique", categoryController.createCateUnique);
router.post("/createCateCus", categoryController.createCateCus);

module.exports = router;
