require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Currency = require("./models/Currency");
const Invoice = require("./models/Invoice");

const connectDB = require("./config/db");

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "XOF", name: "West African CFA Franc", symbol: "FCFA" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
];

const seedData = async () => {
  try {
    await connectDB();

    console.log("Wiping existing data...");
    await Invoice.deleteMany();
    await Currency.deleteMany();
    // await User.deleteMany(); // Uncomment if you also want to wipe users

    console.log("Inserting currencies...");
    await Currency.insertMany(currencies);

    // To seed invoices, we need at least one user
    let user = await User.findOne();
    if (!user) {
      console.log("No user found. Creating a default test user...");
      user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123", // Will be hashed by model pre-save hook
      });
    }

    console.log("Inserting invoices...");
    await Invoice.create([
      {
        userId: user._id,
        invoiceName: "#INV20260521130001",
        clientName: "Acme Corp",
        clientEmail: "billing@acmecorp.com",
        amount: 3000,
        currency: "USD",
        description: "Website Development",
        additionalNotes: "Thank you for your business.",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "pending",
        items: [
          { name: "Design Mockups", price: 1000, qty: 1, total: 1000 },
          { name: "Frontend Development", price: 100, qty: 20, total: 2000 },
        ],
      },
      {
        userId: user._id,
        invoiceName: "#INV20260521130002",
        clientName: "Globex Inc",
        clientEmail: "finance@globex.com",
        amount: 1500,
        currency: "EUR",
        description: "Consulting Services",
        additionalNotes: "Please remit payment within 30 days.",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "paid",
        paidAt: new Date(),
        items: [
          { name: "Security Audit", price: 1500, qty: 1, total: 1500 },
        ],
      },
    ]);

    console.log("Data Seeded Successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    console.log("Destroying data...");
    await Invoice.deleteMany();
    await Currency.deleteMany();
    // await User.deleteMany();

    console.log("Data Destroyed!");
    process.exit();
  } catch (error) {
    console.error("Error destroying data:", error);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  seedData();
}
