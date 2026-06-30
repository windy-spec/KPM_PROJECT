const express = require("express");
const router = express.Router();
const laborController = require("../controllers/labor.controller");

// Định tuyến Categories
router.get("/categories", laborController.getCategories);
router.post("/categories", laborController.createCategory);
router.delete("/categories/:id", laborController.deleteCategory);

// Định tuyến Models
router.get("/models", laborController.getModels);
router.post("/models", laborController.createModel);
router.delete("/models/:id", laborController.deleteModel);

// Định tuyến Rates (Lõi tính giá)
router.get("/rates", laborController.getRates);
router.post("/rates", laborController.setRate); // Dùng POST cho Upsert
router.delete("/rates/:id", laborController.deleteRate);

module.exports = router;
