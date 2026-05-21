const express = require("express");
const router = express.Router();
const {
  stripeWebhook,
  sendReminders,
  sendSpecificReminder,
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/notifications

// Public route for Stripe to post raw webhook events
router.post("/webhook", stripeWebhook);

// Protected trigger endpoint for cron jobs / administrators to trigger reminder sweeps
router.post("/reminders", protect, sendReminders);

// Protected endpoint to send a manual reminder email for a specific invoice
router.post("/reminders/send", protect, sendSpecificReminder);

// Frontend Notification Center routes
router.get("/", protect, getNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;
