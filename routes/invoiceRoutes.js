const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/invoices
router.route("/").post(protect, createInvoice).get(protect, getInvoices);
router.route("/:id").get(protect, getInvoiceById);

module.exports = router;
