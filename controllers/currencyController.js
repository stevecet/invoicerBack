const Currency = require("../models/Currency");

// @desc    Get all currencies
// @route   GET /api/currencies
// @access  Private
exports.getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find();
    res.status(200).json(currencies);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single currency
// @route   GET /api/currencies/:id
// @access  Private
exports.getCurrency = async (req, res) => {
  try {
    const currency = await Currency.findById(req.params.id);
    if (!currency) return res.status(404).json({ message: "Currency not found" });
    res.status(200).json(currency);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new currency
// @route   POST /api/currencies
// @access  Private
exports.createCurrency = async (req, res) => {
  try {
    const currency = await Currency.create(req.body);
    res.status(201).json(currency);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update currency
// @route   PUT /api/currencies/:id
// @access  Private
exports.updateCurrency = async (req, res) => {
  try {
    const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!currency) return res.status(404).json({ message: "Currency not found" });
    res.status(200).json(currency);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete currency
// @route   DELETE /api/currencies/:id
// @access  Private
exports.deleteCurrency = async (req, res) => {
  try {
    const currency = await Currency.findByIdAndDelete(req.params.id);
    if (!currency) return res.status(404).json({ message: "Currency not found" });
    res.status(200).json({ message: "Currency deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
