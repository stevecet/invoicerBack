const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceName: {
      type: String,
      unique: true,
      default: function () {
        const now = new Date();
        const dateStr = now
          .toISOString()
          .replace(/[-:T.]/g, "")
          .substring(0, 14);
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        return `#INV${dateStr}${randomDigits}`;
      },
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "USD",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    items: [itemSchema],
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    stripePaymentLink: {
      type: String,
      trim: true,
      default: "",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
