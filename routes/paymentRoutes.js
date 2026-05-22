const express = require("express");
const router = express.Router();
const { createCheckoutSession, getPaymentStatus } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/payments
router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/status/:invoiceId", getPaymentStatus);

module.exports = router;
