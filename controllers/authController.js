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

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
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
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a reset OTP has been sent",
      });
    }

    const resetOtp = generateResetOtp();
    user.resetPasswordOtp = hashOtp(resetOtp);
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = createTransporter();

    const mailOptions = {
      from: '"My Express App" <noreply@myapp.com>',
      to: user.email,
      subject: "Your Password Reset OTP",
      html: `
        <p>You requested a password reset.</p>
        <p>Your OTP is:</p>
        <h2>${resetOtp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "If that email exists, a reset OTP has been sent",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

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
    const { email, otp, password } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOtp: hashOtp(otp),
      resetPasswordOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
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
