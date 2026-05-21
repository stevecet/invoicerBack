const Invoice = require("../models/Invoice");
const stripe = require("../config/stripe");
const nodemailer = require("nodemailer");
const Notification = require("../models/Notification");

const createNotificationRecord = async ({ userId, invoiceId, type, title, message, recipient }) => {
  try {
    if (!userId) return;
    await Notification.create({
      userId,
      invoiceId,
      type,
      title,
      message,
      recipient,
    });
  } catch (error) {
    console.error(`Error creating notification record: ${error.message}`);
  }
};

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

const sendPaymentConfirmationEmail = async (invoice) => {
  try {
    const transporter = createTransporter();
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(invoice.amount);

    const mailOptions = {
      from: '"Invoicer App" <noreply@myapp.com>',
      to: invoice.clientEmail,
      subject: `Payment Confirmed - Invoice ${invoice.invoiceName || ""}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 32px; text-align: center; }
            .success-icon { font-size: 48px; color: #10b981; margin-bottom: 16px; }
            .title { font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 8px; }
            .subtitle { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
            .invoice-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px; display: inline-block; width: 80%; text-align: left; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { color: #6b7280; font-weight: 500; font-size: 14px; }
            .val { color: #111827; font-weight: 600; font-size: 14px; }
            .footer { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 24px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="success-icon">✓</div>
              <h1 class="title">Thank You!</h1>
              <p class="subtitle">Your payment has been successfully processed.</p>
              
              <div class="invoice-box">
                <div class="row">
                  <span class="label">Invoice Name:</span>
                  <span class="val">${invoice.invoiceName || "N/A"}</span>
                </div>
                <div class="row">
                  <span class="label">Amount Paid:</span>
                  <span class="val" style="color: #10b981;">${formattedAmount}</span>
                </div>
                <div class="row">
                  <span class="label">Payment Date:</span>
                  <span class="val">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              </div>

              <p style="color: #4b5563; font-size: 14px; line-height: 20px;">We appreciate your prompt payment. A copy of this confirmation has been sent to your email.</p>
              
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Invoicer. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${invoice.clientEmail}`);
  } catch (error) {
    console.error(`Error sending payment confirmation email: ${error.message}`);
  }
};

const sendReminderEmail = async (invoice, type) => {
  try {
    const transporter = createTransporter();
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(invoice.amount);

    const formattedDueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    const isOverdue = type === "overdue";
    const subject = isOverdue
      ? `OVERDUE NOTICE: Invoice ${invoice.invoiceName || ""} is past due`
      : `Payment Reminder: Invoice ${invoice.invoiceName || ""} is due soon`;

    const accentColor = isOverdue ? "#ef4444" : "#f59e0b";
    const heading = isOverdue ? "Invoice is Past Due" : "Upcoming Payment Due";
    const subHeading = isOverdue
      ? `This is a notice that invoice <strong>${invoice.invoiceName || ""}</strong> is currently overdue.`
      : `This is a reminder that invoice <strong>${invoice.invoiceName || ""}</strong> is due in the next few days.`;

    const mailOptions = {
      from: '"Invoicer App" <noreply@myapp.com>',
      to: invoice.clientEmail,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${heading}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding: 40px 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 32px; }
            .header { border-bottom: 2px solid ${accentColor}; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
            .badge { display: inline-block; background-color: ${isOverdue ? "#fee2e2" : "#fef3c7"}; color: ${accentColor}; padding: 6px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; }
            .title { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
            .meta-box { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb; }
            .row { display: table; width: 100%; margin-bottom: 12px; }
            .col { display: table-cell; width: 50%; font-size: 14px; color: #4b5563; }
            .col-right { text-align: right; font-weight: 700; color: #111827; }
            .footer { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 24px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <span class="badge">${isOverdue ? "Overdue" : "Reminder"}</span>
                <h1 class="title">${heading}</h1>
              </div>
              
              <div style="font-size: 16px; line-height: 24px; color: #374151;">
                <p>Hello <strong>${invoice.clientName}</strong>,</p>
                <p>${subHeading}</p>
              </div>

              <div class="meta-box">
                <div class="row">
                  <div class="col">Invoice Number:</div>
                  <div class="col col-right">${invoice.invoiceName || "N/A"}</div>
                </div>
                <div class="row">
                  <div class="col">Amount Due:</div>
                  <div class="col col-right" style="color: ${accentColor};">${formattedAmount}</div>
                </div>
                <div class="row" style="margin-bottom: 0;">
                  <div class="col">Due Date:</div>
                  <div class="col col-right" style="color: ${isOverdue ? "#ef4444" : "#111827"};">${formattedDueDate}</div>
                </div>
              </div>

              ${invoice.stripePaymentLink ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invoice.stripePaymentLink}" target="_blank" style="background-color: ${accentColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    Pay This Invoice
                  </a>
                </div>
              ` : ""}

              <div class="footer">
                <p>If you have already paid this invoice, please ignore this notice.</p>
                <p>&copy; ${new Date().getFullYear()} Invoicer. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email (${type}) sent successfully to ${invoice.clientEmail}`);
  } catch (error) {
    console.error(`Error sending reminder email: ${error.message}`);
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId) {
      try {
        const invoice = await Invoice.findById(invoiceId);
        if (invoice) {
          invoice.status = "paid";
          invoice.paidAt = new Date();
          await invoice.save();

          console.log(`Invoice ${invoiceId} successfully marked as paid!`);
          await sendPaymentConfirmationEmail(invoice);

          // Log payment confirmation notification
          const formattedAmount = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: invoice.currency || "USD",
          }).format(invoice.amount);
          await createNotificationRecord({
            userId: invoice.userId,
            invoiceId: invoice._id,
            type: "payment_confirmed",
            title: "Payment Confirmed",
            message: `Invoice ${invoice.invoiceName || ""} for ${formattedAmount} has been marked as paid.`,
            recipient: invoice.clientEmail,
          });
        }
      } catch (error) {
        console.error(`Error updating invoice status from webhook: ${error.message}`);
      }
    }
  }

  res.status(200).json({ received: true });
};

exports.sendReminders = async (req, res) => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const dueSoonInvoices = await Invoice.find({
      status: "pending",
      dueDate: { $gte: today, $lte: threeDaysFromNow },
    });

    console.log(`Found ${dueSoonInvoices.length} invoices due soon.`);
    for (const invoice of dueSoonInvoices) {
      await sendReminderEmail(invoice, "upcoming");
      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency || "USD",
      }).format(invoice.amount);
      await createNotificationRecord({
        userId: invoice.userId,
        invoiceId: invoice._id,
        type: "reminder_sent",
        title: "Upcoming Payment Reminder",
        message: `An automated reminder was sent to ${invoice.clientEmail} for Invoice ${invoice.invoiceName || ""} (${formattedAmount}).`,
        recipient: invoice.clientEmail,
      });
    }

    const overdueInvoices = await Invoice.find({
      status: "pending",
      dueDate: { $lt: today },
    });

    console.log(`Found ${overdueInvoices.length} overdue invoices. Updating statuses...`);
    for (const invoice of overdueInvoices) {
      invoice.status = "overdue";
      await invoice.save();
      await sendReminderEmail(invoice, "overdue");
      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency || "USD",
      }).format(invoice.amount);
      await createNotificationRecord({
        userId: invoice.userId,
        invoiceId: invoice._id,
        type: "overdue_notice",
        title: "Overdue Invoice Notice",
        message: `Invoice ${invoice.invoiceName || ""} (${formattedAmount}) is overdue. An overdue notice has been sent to ${invoice.clientEmail}.`,
        recipient: invoice.clientEmail,
      });
    }

    const result = {
      success: true,
      message: "Reminders processed successfully.",
      dueSoonRemindedCount: dueSoonInvoices.length,
      overdueMarkedCount: overdueInvoices.length,
    };

    if (res) {
      return res.status(200).json(result);
    } else {
      console.log(`[CRON] Reminders processed successfully: ${JSON.stringify(result)}`);
      return result;
    }
  } catch (error) {
    console.error(`Error in sendReminders: ${error.message}`);
    if (res) {
      return res.status(500).json({ success: false, error: error.message });
    } else {
      throw error;
    }
  }
};

exports.sendSpecificReminder = async (req, res) => {
  try {
    const { invoiceId, email } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: "invoiceId is required" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Verify ownership
    if (invoice.userId && invoice.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to access this invoice" });
    }

    // Optional email override
    if (email) {
      invoice.clientEmail = email;
    }

    if (!invoice.clientEmail) {
      return res.status(400).json({ success: false, message: "Invoice clientEmail is not set, and no custom email was supplied" });
    }

    // Determine type (overdue notice vs upcoming reminder)
    const type = invoice.status === "overdue" ? "overdue" : "upcoming";

    await sendReminderEmail(invoice, type);

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(invoice.amount);

    await createNotificationRecord({
      userId: invoice.userId,
      invoiceId: invoice._id,
      type: type === "overdue" ? "overdue_notice" : "reminder_sent",
      title: type === "overdue" ? "Overdue Notice Sent (Manual)" : "Reminder Sent (Manual)",
      message: `A manual reminder was sent to ${invoice.clientEmail} for Invoice ${invoice.invoiceName || ""} (${formattedAmount}).`,
      recipient: invoice.clientEmail,
    });

    return res.status(200).json({
      success: true,
      message: `Reminder email sent successfully to ${invoice.clientEmail}`,
      invoiceId: invoice._id,
      clientEmail: invoice.clientEmail,
      type
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found or unauthorized" });
    }

    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
