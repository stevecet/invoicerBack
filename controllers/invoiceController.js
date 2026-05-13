const Invoice = require("../models/Invoice");

exports.createInvoice = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      amount,
      currency,
      description,
      status,
      dueDate,
      paidAt,
    } = req.body;

    const invoice = await Invoice.create({
      userId: req.user._id,
      clientName,
      clientEmail,
      amount,
      currency,
      description,
      status,
      dueDate,
      paidAt,
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
