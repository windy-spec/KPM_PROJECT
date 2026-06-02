const express = require("express");
const router = express.Router();
const importController = require("../controllers/import.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const multer = require("multer");
const uploadInMemory = multer({ storage: multer.memoryStorage() });

// 1 & 2. Các API cũ
router.get("/template", importController.downloadTemplate);
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  uploadInMemory.single("file"),
  importController.uploadExcel,
);

// ==========================================
// ĐƯỜNG DẪN MỚI CHO GIAI ĐOẠN 4 ĐÂY BRO
// ==========================================

// API 3: Xem chi tiết lô hàng
router.get(
  "/batch/:batchId",
  authMiddleware,
  adminMiddleware,
  importController.getBatch,
);

// API 4: Hủy bỏ lô nhập
router.post(
  "/batch/:batchId/reject",
  authMiddleware,
  adminMiddleware,
  importController.rejectBatch,
);

// API 5: Đồng ý chốt duyệt
router.post(
  "/batch/:batchId/approve",
  authMiddleware,
  adminMiddleware,
  importController.approveBatch,
);
// API 6: Tải file Excel chứa các dòng dữ liệu bị lỗi (INVALID)
router.get(
  "/batch/:batchId/export-errors",
  authMiddleware,
  adminMiddleware,
  importController.exportErrors,
);
router.delete(
  "/batch/:batchId",
  authMiddleware,
  adminMiddleware,
  importController.deleteBatch,
);
module.exports = router;
