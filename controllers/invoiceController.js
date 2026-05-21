const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const parseDate = (val) => {
  if (!val) return undefined;
  if (typeof val === "object" && val.$date) {
    return new Date(val.$date);
  }
  return new Date(val);
};

const parseObjectId = (val) => {
  if (!val) return undefined;
  if (typeof val === "object" && val.$oid) {
    return val.$oid;
  }
  if (mongoose.Types.ObjectId.isValid(val)) {
    return val;
  }
  return undefined;
};

const parseItems = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item) => {
    const newItem = {
      name: item.name,
      price: Number(item.price),
      qty: Number(item.qty),
      total: Number(item.total),
    };
    if (item._id) {
      if (typeof item._id === "object" && item._id.$oid) {
        newItem._id = item._id.$oid;
      } else {
        newItem._id = item._id;
      }
    }
    return newItem;
  });
};

const sendInvoiceEmail = async (invoice) => {
  try {
    const transporter = createTransporter();
    
    // Format amount
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(invoice.amount);

    // Format dueDate
    const formattedDueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    // Generate items rows
    let itemsHtml = "";
    if (invoice.items && invoice.items.length > 0) {
      itemsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; font-weight: 600; color: #374151;">Item</th>
              <th style="padding: 12px; font-weight: 600; color: #374151; text-align: right;">Qty</th>
              <th style="padding: 12px; font-weight: 600; color: #374151; text-align: right;">Price</th>
              <th style="padding: 12px; font-weight: 600; color: #374151; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      invoice.items.forEach((item) => {
        const itemTotal = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: invoice.currency || "USD",
        }).format(item.total);
        
        const itemPrice = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: invoice.currency || "USD",
        }).format(item.price);

        itemsHtml += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; color: #4b5563;">${item.name}</td>
            <td style="padding: 12px; color: #4b5563; text-align: right;">${item.qty}</td>
            <td style="padding: 12px; color: #4b5563; text-align: right;">${itemPrice}</td>
            <td style="padding: 12px; font-weight: 600; color: #111827; text-align: right;">${itemTotal}</td>
          </tr>
        `;
      });

      itemsHtml += `
          </tbody>
        </table>
      `;
    }

    // Payment CTA Button
    let paymentCtaHtml = "";
    if (invoice.stripePaymentLink) {
      paymentCtaHtml = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoice.stripePaymentLink}" target="_blank" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);">
            Pay Invoice Online
          </a>
        </div>
      `;
    }

    const mailOptions = {
      from: '"Invoicer App" <noreply@myapp.com>',
      to: invoice.clientEmail,
      subject: `New Invoice ${invoice.invoiceName || ""} from Invoicer`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceName || ""}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 32px; }
            .header { border-bottom: 1px solid #f3f4f6; padding-bottom: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 20px; font-weight: 700; color: #4f46e5; }
            .invoice-title { font-size: 24px; font-weight: 800; color: #111827; }
            .meta-grid { display: table; width: 100%; margin-bottom: 24px; }
            .meta-col { display: table-cell; width: 50%; vertical-align: top; }
            .label { font-size: 12px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
            .value { font-size: 14px; color: #1f2937; font-weight: 500; }
            .total-section { margin-top: 24px; padding-top: 16px; border-top: 2px solid #e5e7eb; text-align: right; }
            .notes { background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 24px; font-style: italic; color: #4b5563; font-size: 14px; }
            .footer { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 24px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <span class="logo">Invoicer App</span>
                <span class="invoice-title">${invoice.invoiceName || "Invoice"}</span>
              </div>
              
              <div style="font-size: 16px; line-height: 24px; color: #374151; margin-bottom: 24px;">
                <p>Hello <strong>${invoice.clientName}</strong>,</p>
                <p>You have received a new invoice. Please find the details below:</p>
              </div>

              <div class="meta-grid">
                <div class="meta-col">
                  <div class="label">Billed To</div>
                  <div class="value" style="font-weight: 700; font-size: 16px;">${invoice.clientName}</div>
                  <div class="value">${invoice.clientEmail}</div>
                </div>
                <div class="meta-col" style="text-align: right;">
                  <div class="label">Due Date</div>
                  <div class="value" style="font-weight: 700; color: #ef4444;">${formattedDueDate}</div>
                </div>
              </div>

              ${itemsHtml}

              <div class="total-section">
                <span style="font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Total Amount Due</span>
                <div style="font-size: 32px; font-weight: 800; color: #111827; margin-top: 4px;">${formattedAmount}</div>
              </div>

              ${paymentCtaHtml}

              ${invoice.additionalNotes ? `<div class="notes"><strong style="display: block; margin-bottom: 4px; font-style: normal; color: #1f2937;">Notes:</strong>${invoice.additionalNotes}</div>` : ""}

              <div class="footer">
                <p>This is an automated invoice notification. If you have any questions, please contact billing support.</p>
                <p>&copy; ${new Date().getFullYear()} Invoicer. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent successfully to ${invoice.clientEmail}`);

    try {
      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency || "USD",
      }).format(invoice.amount);
      await Notification.create({
        userId: invoice.userId,
        invoiceId: invoice._id,
        type: "invoice_sent",
        title: "Invoice Sent",
        message: `Invoice ${invoice.invoiceName || ""} for ${formattedAmount} has been sent to ${invoice.clientEmail}.`,
        recipient: invoice.clientEmail,
      });
    } catch (err) {
      console.error(`Failed to log invoice_sent notification: ${err.message}`);
    }
  } catch (error) {
    console.error("Error sending invoice email:", error);
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const {
      _id,
      userId,
      clientName,
      clientEmail,
      amount,
      currency,
      description,
      additionalNotes,
      items,
      status,
      stripePaymentLink,
      issueDate,
      dueDate,
      paidAt,
      invoiceName,
    } = req.body;

    const parsedIssueDate = parseDate(issueDate);
    const parsedDueDate = parseDate(dueDate);
    const parsedPaidAt = parseDate(paidAt);
    const parsedItems = parseItems(items);

    const invoiceData = {
      clientName,
      clientEmail,
      amount,
      currency,
      description,
      additionalNotes,
      items: parsedItems,
      status: status || "pending",
      stripePaymentLink,
      issueDate: parsedIssueDate,
      dueDate: parsedDueDate,
      paidAt: parsedPaidAt,
    };

    if (invoiceName) {
      invoiceData.invoiceName = invoiceName;
    }

    const parsedUserId = parseObjectId(userId) || req.user?._id;
    if (parsedUserId) {
      invoiceData.userId = parsedUserId;
    }

    const invoiceId = parseObjectId(_id);

    let oldInvoice = null;
    let isNew = true;

    if (invoiceId) {
      oldInvoice = await Invoice.findById(invoiceId);
      isNew = !oldInvoice;
    }

    let invoice;
    if (invoiceId) {
      invoice = await Invoice.findByIdAndUpdate(invoiceId, invoiceData, {
        new: true,
        upsert: true,
        runValidators: true,
      });
    } else {
      invoice = await Invoice.create(invoiceData);
    }

    // Send email when status is pending
    if (invoice.status === "pending" && invoice.clientEmail) {
      const statusChanged = isNew || (oldInvoice && oldInvoice.status !== "pending");
      if (statusChanged) {
        await sendInvoiceEmail(invoice);
      }
    }

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

exports.updateInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoiceData = { ...req.body };

    if (invoiceData.issueDate) invoiceData.issueDate = parseDate(invoiceData.issueDate);
    if (invoiceData.dueDate) invoiceData.dueDate = parseDate(invoiceData.dueDate);
    if (invoiceData.paidAt) invoiceData.paidAt = parseDate(invoiceData.paidAt);
    if (invoiceData.items) invoiceData.items = parseItems(invoiceData.items);
    if (invoiceData.userId) invoiceData.userId = parseObjectId(invoiceData.userId);

    const oldInvoice = await Invoice.findOne({ _id: invoiceId, userId: req.user._id });
    if (!oldInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, userId: req.user._id },
      invoiceData,
      { new: true, runValidators: true }
    );

    // Send email when status changes/is updated to pending
    if (invoice.status === "pending" && invoice.clientEmail) {
      const statusChanged = oldInvoice.status !== "pending";
      if (statusChanged) {
        await sendInvoiceEmail(invoice);
      }
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
