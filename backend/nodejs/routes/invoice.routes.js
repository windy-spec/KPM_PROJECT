const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice.controller");
const authenticateToken = require("../middlewares/auth.middleware");

router.get("/my-invoices", authenticateToken, invoiceController.getMyInvoices);
router.get("/:id", authenticateToken, invoiceController.getInvoiceDetail);

module.exports = router;
