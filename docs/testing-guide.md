# Testing Guide

## Overview

The project has **no automated test suite**. All testing is manual via API clients (Postman, cURL, browser). This guide covers how to start the server and test each endpoint.

## Setup

### Prerequisites

- Node.js installed
- MongoDB connection (local or Atlas)
- Stripe account (for payment testing)
- Cloudinary account (for image upload testing)

### Installation

```bash
npm install
```

### Environment

Create a `.env` file in the project root with all required variables (see [environment-variables.md](environment-variables.md)).

### Start Server

```bash
npm run dev
```

Uses **nodemon** to watch `src/server.js` and restart on changes. Server starts on `http://localhost:3000`.

## Testing Endpoints

Use **cURL**, **Postman**, or **Insomnia** to test the API.

### 1. Health Check

```bash
curl http://localhost:3000/products
```

Expected: `200` with JSON array of products (empty if no data).

### 2. Registration

```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Expected: `201` with user data and token.

### 3. Login

```bash
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: `200` with user data and token. Save the `token` value for subsequent requests.

### 4. Profile Access

```bash
curl http://localhost:3000/users/profile \
  -H "Authorization: Bearer <token>"
```

Expected: `200` with decoded JWT payload.

### 5. Create Product (Admin)

First register an admin user by setting `"role":"admin"` during registration, or manually update the role in the database.

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer <admin-token>" \
  -F "name=Test Product" \
  -F "prices=29.99" \
  -F "category=Clothing" \
  -F "sizes=S" \
  -F "stock=10"
```

Expected: `201` with product data.

### 6. Add to Cart

```bash
curl -X POST http://localhost:3000/cart/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<product-id>","quantity":2}'
```

Expected: `201` with success message.

### 7. View Cart

```bash
curl http://localhost:3000/cart \
  -H "Authorization: Bearer <token>"
```

Expected: `200` with cart data.

### 8. Create Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress":"123 Main St, New York, NY 10001"}'
```

Expected: `201` with order data.

## Testing Stripe Payment

### With Stripe CLI

1. Install the Stripe CLI.
2. Forward webhook events:
   ```bash
   stripe listen --forward-to localhost:3000/webhook/stripe
   ```
3. Copy the webhook signing secret printed by the CLI and add it to `.env` as `STRIPE_WEBHOOK_SECRET`.
4. Create a checkout session:
   ```bash
   curl -X POST http://localhost:3000/checkout/create-checkout-session \
     -H "Authorization: Bearer <token>"
   ```
5. Open the returned `url` in a browser.
6. Use Stripe test card: `4242 4242 4242 4242` with any future date and any CVC.
7. After payment, verify the webhook logs show order creation.

## Known Testing Issues

- **No test database** — tests run against the development database. There is no test environment separation.
