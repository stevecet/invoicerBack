const User = require("../models/User");

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields dynamically
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save();

    // Convert to object and exclude password
    const returnedUser = user.toObject();
    delete returnedUser.password;

    res.status(200).json(returnedUser);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// CREATE: Create a user
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// READ: Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// READ: Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// UPDATE: Update user details
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields dynamically
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save();

    const returnedUser = user.toObject();
    delete returnedUser.password;

    res.status(200).json(returnedUser);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE: Remove a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
