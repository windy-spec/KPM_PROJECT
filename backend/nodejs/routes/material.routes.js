const express = require("express");
const router = express.Router();
const materialController = require("../controllers/material.controller");

// Ở giai đoạn test, tạm tắt authMiddleware để Postman gọi thoải mái
router.get("/", materialController.getAll);
router.get("/:id", materialController.getById);
router.post("/", materialController.create);
router.put("/:id", materialController.update);
router.delete("/:id", materialController.delete);

module.exports = router;
