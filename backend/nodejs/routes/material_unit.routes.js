const express = require("express");
const router = express.Router();
const materialUnitController = require("../controllers/material_unit.controller");

router.get("/", materialUnitController.getAll);
router.post("/", materialUnitController.create);
router.put("/:id", materialUnitController.update);
router.delete("/:id", materialUnitController.delete);

module.exports = router;
