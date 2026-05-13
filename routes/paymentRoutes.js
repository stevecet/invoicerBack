const express = require("express");
const router = express.Router();
const { createCheckoutSession } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/payments
router.post("/create-checkout-session", protect, createCheckoutSession);

module.exports = router;
