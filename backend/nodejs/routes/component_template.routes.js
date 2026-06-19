const express = require("express");
const router = express.Router();
const templateController = require("../controllers/component_template.controller");
const authenticateToken = require("../middlewares/auth.middleware");

router.get("/", templateController.getAll);
router.get("/:id", templateController.getById);

// Thêm, sửa, xóa thường chỉ admin được làm, nhưng tạm thời cứ authenicateToken
router.post("/", authenticateToken, templateController.create);
router.put("/:id", authenticateToken, templateController.update);
router.delete("/:id", authenticateToken, templateController.delete);

module.exports = router;
