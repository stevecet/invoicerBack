const express = require("express");
const router = express.Router();
const {
  getCurrencies,
  getCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} = require("../controllers/currencyController");
const { protect } = require("../middleware/authMiddleware");

// URL: /api/currencies
// Protect all currency routes
router.use(protect);

router.route("/")
  .get(getCurrencies)
  .post(createCurrency);

router.route("/:id")
  .get(getCurrency)
  .put(updateCurrency)
  .delete(deleteCurrency);

module.exports = router;
