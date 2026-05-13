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
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Invoices

- `POST /api/invoices`
- `GET /api/invoices`
- `GET /api/invoices/:id`

### Payments

- `POST /api/payments/create-checkout-session`

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
  "dueDate": "2026-05-20T00:00:00.000Z"
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
- `resetPasswordToken`
- `resetPasswordExpires`
- `createdAt`
- `updatedAt`

### Invoice

- `userId`
- `clientName`
- `clientEmail`
- `amount`
- `currency`
- `description`
- `status`
- `stripePaymentLink`
- `dueDate`
- `paidAt`
- `createdAt`
- `updatedAt`

## Current Limitations

- No Stripe webhook yet to auto-mark invoices as paid
- No invoice update or delete endpoints yet
- No role-based authorization for user management
- Minimal validation beyond Mongoose schema validation

## Next Recommended Improvements

- Add Stripe webhook handling for successful payments
- Update invoice status to `paid` and set `paidAt`
- Add invoice update and delete endpoints
- Add request validation with a library like `zod` or `express-validator`
- Add tests for auth, invoices, and payments
