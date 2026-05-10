const express = require("express");
const router = express.Router();
const MaterialController = require("../controllers/material.controller");

router.get("/", MaterialController.getMaterials);
module.exports = router;
