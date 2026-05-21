# Invoicer Backend

Backend API for user authentication, invoice management, and Stripe checkout session creation.

## Features

- JWT authentication
- User registration and login
- Password reset via email
- Protected user endpoints
- Invoice creation and retrieval
- Stripe Checkout Session creation for invoice payments

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT
- Nodemailer
- Stripe

## Project Structure

```text
config/
controllers/
middleware/
models/
routes/
utils/
index.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root with:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

EMAIL_HOST=your_smtp_host
EMAIL_PORT=2525
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password

STRIPE_SECRET_KEY=your_stripe_secret_key
APP_URL=http://localhost:3000
```

Notes:

- `APP_URL` is optional but recommended for Stripe success and cancel redirects.
- `EMAIL_*` variables are used by the forgot-password flow.

### 3. Start the server

```bash
npm start
```

The API runs by default on `http://localhost:3000`.

## Authentication

Protected endpoints require a Bearer token:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `PUT /api/auth/reset-password/:token`

### Users

- `GET /api/users`
- `GET /api/users/me` (Get current user)
- `PATCH /api/users/me` (Update current user)
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Currencies

- `GET /api/currencies`
- `POST /api/currencies`
- `GET /api/currencies/:id`
- `PUT /api/currencies/:id`
- `DELETE /api/currencies/:id`

### Invoices

- `POST /api/invoices`
- `GET /api/invoices`
- `GET /api/invoices/:id`

- `POST /api/payments/create-checkout-session`

### Notifications

- `POST /api/notifications/webhook` (Stripe Webhook for payments verification)
- `POST /api/notifications/reminders` (Sweep database and trigger upcoming/overdue reminders)

## Example Requests

### Register

```bash
curl --location 'http://localhost:3000/api/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "John Doe",
  "email": "john@test.com",
  "password": "123456"
}'
```

### Login

```bash
curl --location 'http://localhost:3000/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "john@test.com",
  "password": "123456"
}'
```

### Create Invoice

```bash
curl --location 'http://localhost:3000/api/invoices' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "clientName": "Acme Inc",
  "clientEmail": "billing@acme.com",
  "amount": 2500,
  "currency": "USD",
  "description": "Website redesign deposit",
  "additionalNotes": "Please pay within 30 days.",
  "dueDate": "2026-05-20T00:00:00.000Z",
  "items": [
    {
      "name": "Design Phase",
      "price": 1000,
      "qty": 1,
      "total": 1000
    },
    {
      "name": "Development Phase",
      "price": 1500,
      "qty": 1,
      "total": 1500
    }
  ]
}'
```

### Get Invoices

```bash
curl --location 'http://localhost:3000/api/invoices' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Create Stripe Checkout Session

```bash
curl --location 'http://localhost:3000/api/payments/create-checkout-session' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--header 'Content-Type: application/json' \
--data-raw '{
  "invoiceId": "INVOICE_OBJECT_ID"
}'
```

Example response:

```json
{
  "invoiceId": "INVOICE_OBJECT_ID",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "stripePaymentLink": "https://checkout.stripe.com/..."
}
```

## Data Models

### User

- `name`
- `email`
- `password`
- `language`
- `currency`
- `resetPasswordOtp`
- `resetPasswordOtpExpires`
- `createdAt`
- `updatedAt`

### Currency

- `code` (e.g., USD)
- `name` (e.g., US Dollar)
- `symbol` (e.g., $)
- `createdAt`
- `updatedAt`

### Invoice

- `userId`
- `invoiceName` (Auto-generated, e.g., #INV20240725018456)
- `clientName`
- `clientEmail`
- `amount`
- `currency`
- `description`
- `additionalNotes`
- `items` (Array of objects: `name`, `price`, `qty`, `total`)
- `status`
- `stripePaymentLink`
- `issueDate`
- `dueDate`
- `paidAt`
- `createdAt`
- `updatedAt`

## Current Limitations

- No role-based authorization for user management
- Minimal validation beyond Mongoose schema validation

## Next Recommended Improvements

- Add request validation with a library like `zod` or `express-validator`
- Add tests for auth, invoices, and payments
