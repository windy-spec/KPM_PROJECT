const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forum.controller");
const authenticateToken = require("../middlewares/auth.middleware");

// ========================================================
// PUBLIC ROUTES
// ========================================================
router.get("/public", forumController.getPublicPosts);
router.get("/public/:id", forumController.getPostById);

// ========================================================
// ADMIN ROUTES
// ========================================================
router.get("/admin", authenticateToken, forumController.getAdminPosts);
router.post("/admin/generate", authenticateToken, forumController.generatePost);
router.put("/admin/:id", authenticateToken, forumController.updatePost);
router.get("/admin/:id", authenticateToken, forumController.getPostById);

module.exports = router;
