# Webhooks

## Overview

Stripe webhook endpoint that listens for `checkout.session.completed` events to create orders and clear carts after successful payments.

## Source Files

| File | Role |
|------|------|
| `src/Routers/webhookRouter.js` | Webhook route definition and handler |

## Critical Architecture Note

The webhook router is mounted **before** `express.json()` in `server.js`:

```javascript
server.use('/webhook', webhookRouter)
server.use(express.json())  // JSON parser comes AFTER webhook
```

This is because Stripe webhooks require the **raw request body** for signature verification. The webhook router applies `bodyParser.raw({ type: "application/json" })` only to the `/webhook/stripe` route.

## Endpoint

### POST /webhook/stripe (Public)

Receives Stripe webhook events.

**Headers:**
```
stripe-signature: <signature>
Content-Type: application/json
```

**No authentication required** — security is handled via Stripe webhook signature verification.

## Event Handling

### Event Type: `checkout.session.completed`

This is the only event type currently handled.

**Flow:**

1. **Signature Verification:**
   ```javascript
   event = stripe.webhooks.constructEvent(
     req.body,           // raw body
     signature,          // stripe-signature header
     process.env.STRIPE_WEBHOOK_SECRET
   )
   ```
   If verification fails, returns 400 with the error message.

2. **Cart Retrieval:**
   ```javascript
   const cart = await Cart.findOne({ user: session.client_reference_id })
     .populate("items.product")
   ```
   The `client_reference_id` was set during checkout session creation to the user's MongoDB `_id`.

3. **Order Creation:**
   ```javascript
   const order = new Order({
     user: session.client_reference_id,
     items: cart.items.map(item => ({ product: item.product._id, quantity: item.quantity })),
     totalPrice: session.amount_total / 100, // convert cents to dollars
     status: "Paid",
     shippingAddress: 'No shipping address provided',
   })
   ```

4. **Cart Clearing:**
   ```javascript
   cart.items = []
   await cart.save()
   ```
   Unlike the direct order creation endpoint (which deletes the cart), the webhook **clears the items array** but keeps the cart document.

**Response (200):**
```json
{
  "received": true
}
```

## Stripe Credentials

| Variable | Description |
|----------|-------------|
| `STRIPE_API_SECRET_KEY` | Stripe secret key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (starts with `whsec_`) |

## Testing Webhooks Locally

Use the Stripe CLI to forward webhook events to your local server:

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

Then trigger test events:

```bash
stripe trigger checkout.session.completed
```

## Known Issues

1. **No `shippingAddress` collected from user** — the webhook uses a placeholder `'No shipping address provided'` since Stripe Checkout doesn't collect shipping info in the current setup.
