require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

connectDB();

const app = express();

// Custom Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

const { paymentSuccess, paymentCancelled } = require("./controllers/paymentController");

// Mounting Routes
app.get("/payment-success", paymentSuccess);
app.get("/payment-cancelled", paymentCancelled);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Setup Automated Invoice Reminders Cron Job
  const cron = require("node-cron");
  const { sendReminders } = require("./controllers/notificationController");
  const cronSchedule = process.env.REMINDERS_CRON_SCHEDULE || "0 0 * * *";

  console.log(`[CRON] Scheduling automated reminder/overdue sweeps with schedule: "${cronSchedule}"`);
  cron.schedule(cronSchedule, async () => {
    console.log("[CRON] Running scheduled invoice sweep...");
    try {
      await sendReminders();
    } catch (err) {
      console.error(`[CRON] Automated sweep failed: ${err.message}`);
    }
  });
});
