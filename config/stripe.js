const Stripe = require("stripe");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

module.exports = new Stripe(stripeSecretKey);
