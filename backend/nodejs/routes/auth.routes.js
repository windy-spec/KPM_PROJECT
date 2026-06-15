// Copy đè toàn bộ file auth.routes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware"); // Import gác cổng

// 1. CÁC ROUTE KHÔNG CẦN TOKEN (PUBLIC)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOTP);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// 2. CÁC ROUTE BẮT BUỘC CÓ TOKEN (PRIVATE)
router.get("/me", authMiddleware, authController.getCurrentUser);
router.post("/logout", authMiddleware, authController.logout);
router.put("/change-password", authMiddleware, authController.changePassword);
router.put("/profile", authMiddleware, authController.updateProfile);

// 3. ROUTE QUẢN LÝ (ADMIN ONLY)
router.get("/admin/access-logs", authMiddleware, authController.getAccessLogs);
router.get("/admin/users", authMiddleware, authController.getAllUsers);
router.put(
  "/admin/users/:id",
  authMiddleware,
  authController.updateUserByAdmin,
);
router.post("/google", authController.googleLogin);
module.exports = router;
