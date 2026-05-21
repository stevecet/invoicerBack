const stripe = require("../config/stripe");

const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const toStripeUnitAmount = (amount, currency) => {
  const normalizedCurrency = currency.toUpperCase();

  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
};

const createInvoiceCheckoutSession = async ({ invoice, userId, baseUrl }) => {
  let line_items;

  if (invoice.items && invoice.items.length > 0) {
    line_items = invoice.items.map((item) => ({
      price_data: {
        currency: invoice.currency.toLowerCase(),
        product_data: {
          name: item.name,
          description: `Qty: ${item.qty} @ ${invoice.currency.toUpperCase()} ${item.price}`,
        },
        unit_amount: toStripeUnitAmount(item.price, invoice.currency),
      },
      quantity: item.qty,
    }));
  } else {
    line_items = [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: `Invoice for ${invoice.clientName}`,
            description: invoice.description || `Invoice ${invoice._id}`,
          },
          unit_amount: toStripeUnitAmount(invoice.amount, invoice.currency),
        },
        quantity: 1,
      },
    ];
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.clientEmail,
    success_url: `${baseUrl}/payment-success?invoiceId=${invoice._id}`,
    cancel_url: `${baseUrl}/payment-cancelled?invoiceId=${invoice._id}`,
    metadata: {
      invoiceId: invoice._id.toString(),
      userId: userId.toString(),
    },
    line_items,
  });
};

module.exports = {
  createInvoiceCheckoutSession,
};
