# Checkout API

## Overview

Payment processing via **Stripe Checkout Sessions**. The backend creates a Stripe Checkout Session URL that the frontend redirects the user to for secure payment.

## Source Files

| File | Role |
|------|------|
| `src/Routers/checkoutRouter.js` | Checkout session creation endpoint |
| `src/Modules/cart.js` | Cart model for building line items |

## Endpoint

### POST /checkout/create-checkout-session (Protected)

Creates a Stripe Checkout Session using the current user's cart contents.

**Headers:**
```
Authorization: Bearer <token>
```

**No request body required** — cart data is fetched from the database.

**Response (200):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error (400):**
```json
{
  "message": "empty cart"
}
```

## Session Creation Flow

1. Fetch the user's cart (populated with product data).
2. If cart is empty or doesn't exist, return 400.
3. Convert cart items to Stripe's `line_items` format:
   ```javascript
   const line_items = cart.items.map(item => ({
     price_data: {
       currency: "usd",
       product_data: { name: item.product.name },
       unit_amount: Math.round(item.product.prices * 100) // cents
     },
     quantity: item.quantity
   }))
   ```
4. Create Stripe Checkout Session:
   ```javascript
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ["card"],
     line_items,
     mode: "payment",
     success_url: "http://localhost:3000/success",
     cancel_url: "http://localhost:3000/cancel",
     client_reference_id: req.user.id  // used in webhook to identify user
   })
   ```
5. Return `{ url: session.url }` — the frontend should redirect the user to this URL.

## Stripe Integration Details

- **Stripe SDK:** `stripe` npm package v19+
- **API Key:** `STRIPE_API_SECRET_KEY` environment variable
- **Currency:** USD only
- **Payment methods:** Card only
- **Mode:** Payment (one-time, not subscription)
- **Success URL:** `http://localhost:3000/success` (redirects after payment)
- **Cancel URL:** `http://localhost:3000/cancel` (redirects if user cancels)
- **Client reference ID:** The MongoDB `_id` of the authenticated user (used in webhook to associate payment with user)

## Frontend Integration

```javascript
// Example: redirect to Stripe Checkout
const response = await fetch('http://localhost:3000/checkout/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const data = await response.json()
window.location.href = data.url  // Redirect to Stripe
```

## Post-Payment Flow

After successful payment, Stripe sends a `checkout.session.completed` event to the **webhook endpoint**. See [webhooks.md](webhooks.md) for details on how the order is created after payment.

## Known Issues

- **Hardcoded URLs:** `success_url` and `cancel_url` are hardcoded to `http://localhost:3000/success` and `http://localhost:3000/cancel`, which point to the **backend** server, not the frontend. The frontend should handle its own success/cancel pages and these URLs should be updated to point to the frontend.
- **Order not created immediately:** The order is created asynchronously via the webhook, not during the checkout session creation. There is a delay between payment and order confirmation.
- **No shipping address collected:** The checkout session does not collect shipping information — it only uses product prices and quantities from the cart.
