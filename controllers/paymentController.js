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

exports.getPaymentStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    return res.status(200).json({ success: true, status: invoice.status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    const { invoiceId } = req.query;
    if (!invoiceId) {
      return res.status(400).send("<h1>Error: invoiceId is required</h1>");
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).send("<h1>Error: Invoice not found</h1>");
    }

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(invoice.amount);

    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful | Invoicer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.15);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.2);
      --warning: #f59e0b;
      --bg: #090514;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 50% -20%, #1e1145 0%, #090514 70%);
      color: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }
    
    .card {
      background: rgba(17, 12, 34, 0.45);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 520px;
      text-align: center;
      box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.7);
      position: relative;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .card.is-paid {
      border-color: rgba(16, 185, 129, 0.3);
      box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.1);
    }
    
    .icon-container {
      width: 96px;
      height: 96px;
      margin: 0 auto 30px auto;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.5s ease;
    }
    
    /* Pending/Processing Icon State */
    .icon-container.is-pending {
      background: rgba(245, 158, 11, 0.1);
      border: 2px solid rgba(245, 158, 11, 0.3);
      color: var(--warning);
      animation: spinner-pulse 2s infinite ease-in-out;
    }
    
    .icon-container.is-pending::before {
      content: '';
      position: absolute;
      width: 106px;
      height: 106px;
      border-radius: 50%;
      border: 2px solid var(--warning);
      border-top-color: transparent;
      border-left-color: transparent;
      animation: spin 1s infinite linear;
    }
    
    /* Paid Icon State */
    .icon-container.is-paid {
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid rgba(16, 185, 129, 0.4);
      color: var(--success);
      transform: scale(1.1);
      box-shadow: 0 0 30px var(--success-glow);
    }
    
    .icon-container svg {
      width: 44px;
      height: 44px;
      transition: all 0.3s ease;
    }
    
    .icon-container .svg-check {
      display: none;
    }
    
    .icon-container.is-paid .svg-loader {
      display: none;
    }
    
    .icon-container.is-paid .svg-check {
      display: block;
      animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    
    /* Typography */
    h1 {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    p.subtitle {
      font-size: 16px;
      color: #9ca3af;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    
    /* Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 35px;
      transition: all 0.4s ease;
    }
    
    .status-badge.is-pending {
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .status-badge.is-paid {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .status-badge.is-pending .status-dot {
      background-color: var(--warning);
      animation: blink 1.5s infinite ease-in-out;
    }
    
    .status-badge.is-paid .status-dot {
      background-color: var(--success);
      box-shadow: 0 0 8px var(--success);
    }
    
    /* Details Block */
    .details-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 35px;
      text-align: left;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .row:last-child {
      margin-bottom: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 16px;
    }
    
    .label {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
    }
    
    .val {
      color: #e5e7eb;
      font-size: 14px;
      font-weight: 600;
    }
    
    .val.amount {
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
    }
    
    .card.is-paid .val.amount {
      color: #34d399;
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
    }
    
    /* Buttons */
    .btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    /* Keyframes */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes spinner-pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
      50% { transform: scale(1.03); box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }
    }
    @keyframes scale-up {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes blink {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>

  <div class="card is-pending" id="main-card">
    <div class="icon-container is-pending" id="icon-container">
      <!-- Processing Loader SVG -->
      <svg class="svg-loader" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <!-- Checked/Success SVG -->
      <svg class="svg-check" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    
    <h1 id="title-heading">Confirming Payment...</h1>
    <p class="subtitle" id="subtitle-para">We are waiting for Stripe to confirm your payment. Please do not close this window.</p>
    
    <div class="status-badge is-pending" id="status-badge">
      <span class="status-dot"></span>
      <span id="status-text">Processing</span>
    </div>
    
    <div class="details-box">
      <div class="row">
        <span class="label">Invoice Name</span>
        <span class="val">${invoice.invoiceName || "N/A"}</span>
      </div>
      <div class="row">
        <span class="label">Billed To</span>
        <span class="val">${invoice.clientName}</span>
      </div>
      <div class="row">
        <span class="label">Amount Paid</span>
        <span class="val amount" id="amount-val">${formattedAmount}</span>
      </div>
    </div>
    
    <a href="#" class="btn">Return to Application</a>
  </div>

  <script>
    const invoiceId = "${invoice._id}";
    const pollUrl = "/api/payments/status/" + invoiceId;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(pollUrl);
        const data = await response.json();
        
        if (data.success && data.status === 'paid') {
          // Transition UI to PAID State!
          document.getElementById('main-card').className = "card is-paid";
          document.getElementById('icon-container').className = "icon-container is-paid";
          document.getElementById('status-badge').className = "status-badge is-paid";
          document.getElementById('status-text').innerText = "Confirmed";
          document.getElementById('title-heading').innerText = "Payment Successful!";
          document.getElementById('subtitle-para').innerText = "Thank you! Your payment has been securely received and processed.";
          
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };
    
    // Check immediately and then every 2 seconds
    checkStatus();
    const pollInterval = setInterval(checkStatus, 2000);
  </script>
</body>
</html>
    `);
  } catch (error) {
    return res.status(500).send(`<h1>An error occurred</h1><p>${error.message}</p>`);
  }
};

exports.paymentCancelled = async (req, res) => {
  try {
    const { invoiceId } = req.query;
    let invoice = null;
    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId);
    }

    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Cancelled | Invoicer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #f59e0b;
      --primary-glow: rgba(245, 158, 11, 0.15);
      --bg: #090514;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 50% -20%, #2b1d0c 0%, #090514 70%);
      color: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }
    
    .card {
      background: rgba(22, 17, 12, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(245, 158, 11, 0.15);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 520px;
      text-align: center;
      box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.05);
    }
    
    .icon-container {
      width: 96px;
      height: 96px;
      margin: 0 auto 30px auto;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(245, 158, 11, 0.08);
      border: 2px solid rgba(245, 158, 11, 0.3);
      color: var(--primary);
    }
    
    .icon-container svg {
      width: 44px;
      height: 44px;
    }
    
    /* Typography */
    h1 {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #ffffff 0%, #fcd34d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    p.subtitle {
      font-size: 16px;
      color: #9ca3af;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    
    /* Details Block */
    .details-box {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 35px;
      text-align: left;
    }
    
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .row:last-child {
      margin-bottom: 0;
    }
    
    .label {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
    }
    
    .val {
      color: #e5e7eb;
      font-size: 14px;
      font-weight: 600;
    }
    
    /* Buttons */
    .btn {
      display: block;
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
    
    .btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="icon-container">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    </div>
    
    <h1>Payment Cancelled</h1>
    <p class="subtitle">The checkout session was cancelled. No payment was processed for this invoice.</p>
    
    <div class="details-box">
      <div class="row">
        <span class="label">Invoice Name</span>
        <span class="val">${invoice ? invoice.invoiceName : "N/A"}</span>
      </div>
      <div class="row">
        <span class="label">Billed To</span>
        <span class="val">${invoice ? invoice.clientName : "N/A"}</span>
      </div>
    </div>
    
    <a href="#" class="btn">Back to Billing</a>
  </div>

</body>
</html>
    `);
  } catch (error) {
    return res.status(500).send(`<h1>An error occurred</h1><p>${error.message}</p>`);
  }
};
