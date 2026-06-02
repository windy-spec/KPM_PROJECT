const express = require("express");
const router = express.Router();
const paintTypeController = require("../controllers/paint_type.controller");

router.get("/", paintTypeController.getAll);
router.post("/", paintTypeController.create);
router.put("/:id", paintTypeController.update);
router.delete("/:id", paintTypeController.delete);

module.exports = router;
