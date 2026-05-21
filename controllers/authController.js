const User = require("../models/User");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const nodemailer = require("nodemailer");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateResetOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const normalizeEmail = (email = "") => {
  return email.trim().toLowerCase();
};

exports.registerUser = async (req, res) => {
  const { name, password } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Email does not exist" });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.json({
      _id: user._id,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetOtp = generateResetOtp();
    user.resetPasswordOtp = hashOtp(resetOtp);
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = createTransporter();

    const mailOptions = {
      from: '"Invoicer App" <noreply@myapp.com>',
      to: user.email,
      subject: `${resetOtp} is your password reset verification code`,
      html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 20px; font-weight: 700; color: #1f2937; letter-spacing: -0.5px; }
        .title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 12px; text-align: center; }
        .text { font-size: 16px; line-height: 24px; color: #4b5563; margin-bottom: 24px; text-align: center; }
        .otp-container { background-color: #f3f4f6; border-radius: 8px; border: 1px dashed #d1d5db; padding: 16px; margin: 24px 0; text-align: center; letter-spacing: 6px; }
        .otp-code { font-size: 32px; font-weight: 800; color: #6200ee; margin: 0; padding-left: 6px; } /* Matches React Native Paper default color */
        .footer { font-size: 13px; line-height: 18px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 32px; }
        .warning { font-size: 14px; color: #9ca3af; font-style: italic; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <span class="logo">Invoicer App</span>
          </div>
          <p class="text">We received a request to reset your password. Use the verification code below to complete the process:</p>
          
          <div class="otp-container">
            <h2 class="otp-code">${resetOtp}</h2>
          </div>
          
          <p class="text" style="font-size: 14px; color: #6b7280;">This security code is temporary and will expire in <strong>10 minutes</strong>.</p>
          
          <div class="footer">
            <p>If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>
            <p class="warning">Never share this code with anyone. Our support team will never ask for it.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Reset OTP sent to your email",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = normalizeEmail(req.body.email);

    const user = await User.findOne({
      email,
      resetPasswordOtp: hashOtp(otp),
      resetPasswordOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { otp, password } = req.body;
    const email = normalizeEmail(req.body.email);

    const user = await User.findOne({
      email,
      resetPasswordOtp: hashOtp(otp),
      resetPasswordOtpExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const isSamePassword = await user.matchPassword(password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from the current password",
      });
    }

    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

