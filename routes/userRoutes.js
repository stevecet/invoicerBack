const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/users
// All these routes now require a valid JWT token
router.route("/me").get(protect, getMe).put(protect, updateMe);

router.route("/").get(protect, getUsers);

router
  .route("/:id")
  .get(protect, getUser)
  .put(protect, updateUser)
  .delete(protect, deleteUser);

module.exports = router;
