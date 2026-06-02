const express = require("express");
const router = express.Router();
const materialTypeController = require("../controllers/material_type.controller");

router.get("/", materialTypeController.getAll);
router.post("/", materialTypeController.create);
router.put("/:id", materialTypeController.update);
router.delete("/:id", materialTypeController.delete);

module.exports = router;
