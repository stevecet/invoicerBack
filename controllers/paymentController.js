const Invoice = require("../models/Invoice");
const { createInvoiceCheckoutSession } = require("../utils/stripeCheckout");

exports.createCheckoutSession = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ message: "invoiceId is required" });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      userId: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

    const session = await createInvoiceCheckoutSession({
      invoice,
      userId: req.user._id,
      baseUrl,
    });

    invoice.stripePaymentLink = session.url;
    await invoice.save();

    res.status(200).json({
      invoiceId: invoice._id,
      checkoutUrl: session.url,
      stripePaymentLink: session.url,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
