const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// Trong thực tế nên checkRole admin cho các route này
router.get("/dashboard/stats", authenticateToken, adminController.getDashboardStats);

module.exports = router;
