const express = require("express");
const router = express.Router();
const thicknessController = require("../controllers/material_thickness.controller");

router.get("/", thicknessController.getAll);
router.post("/", thicknessController.create);
router.put("/:id", thicknessController.update);
router.delete("/:id", thicknessController.delete);

module.exports = router;
