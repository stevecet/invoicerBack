const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

// URL: /api/auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.put("/reset-password", resetPassword);

module.exports = router;
