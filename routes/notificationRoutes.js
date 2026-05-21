const express = require("express");
const router = express.Router();
const {
  stripeWebhook,
  sendReminders,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/notifications

// Public route for Stripe to post raw webhook events
router.post("/webhook", stripeWebhook);

// Protected trigger endpoint for cron jobs / administrators to trigger reminder sweeps
router.post("/reminders", protect, sendReminders);

module.exports = router;
