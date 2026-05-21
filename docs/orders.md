# Orders API

## Overview

Order management — create orders from the current cart, retrieve user order history, and track order status. Orders can be created either directly via the `/orders` endpoint or automatically via the Stripe webhook after successful payment.

## Source Files

| File | Role |
|------|------|
| `src/Routers/orderRouter.js` | Route definitions and handlers |
| `src/Modules/order.js` | Order Mongoose schema and model |
| `src/Modules/cart.js` | Cart model referenced during order creation |
| `src/Routers/webhookRouter.js` | Stripe webhook (also creates orders) |

## Order Schema

**File:** `src/Modules/order.js`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `user` | ObjectId (ref: User) | Yes | The user who placed the order |
| `items` | [Object] | Yes | Array of ordered items |
| `items[].product` | ObjectId (ref: Product) | Yes | Product reference |
| `items[].quantity` | Number | Yes | Quantity ordered |
| `totalPrice` | Number | Yes | Calculated total |
| `shippingAddress` | String | Yes | Shipping destination |
| `status` | String | No | Enum: `Pending`, `Paid`, `Shipped`, `Delivered`, `Canceled`. Default: `Pending` |
| `timestamps` | — | — | `createdAt`, `updatedAt` (auto) |

## Data Relationships

```
User (1) ──── Order (N) ──── Items (N) ──── Product (1)
Cart (1) ─── (converts to) ──── Order (1)
```

## Endpoints

### GET /orders (Protected)

Returns the user's order history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "665a...",
  "user": "665a...",
  "items": [
    {
      "product": {
        "_id": "665a...",
        "name": "Classic T-Shirt",
        "prices": 29.99,
        ...
      },
      "quantity": 2,
      "_id": "665a..."
    }
  ],
  "totalPrice": 59.98,
  "shippingAddress": "123 Main St, City, Country",
  "status": "Pending",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Note:** Returns all orders for the authenticated user. If no orders exist, returns an empty array `[]`.

### POST /orders (Protected)

Creates a new order from the current user's cart. The cart is then cleared.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "shippingAddress": "string (required)"
}
```

**Response (201):**
```json
{
  "message": "Order created",
  "order": {
    "_id": "665a...",
    "user": "665a...",
    "items": [
      { "product": "665a...", "quantity": 2 }
    ],
    "totalPrice": 59.98,
    "shippingAddress": "123 Main St, City, Country",
    "status": "Pending",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Error (400):**
```json
{
  "message": "Empty Cart"
}
```

**Order Creation Flow:**
1. Fetch user's cart with populated product data.
2. Calculate total price: `items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)`.
3. Create Order document with:
   - `user`: from JWT
   - `items`: mapped from cart items (only `product._id` and `quantity`, not populated data)
   - `totalPrice`: calculated total
   - `shippingAddress`: from request body
   - `status`: defaults to `"Pending"`
4. Save order.
5. Delete the cart document entirely with `cart.deleteOne()`.
6. Return the new order.

## Order Statuses

| Status | Description | Set By |
|--------|-------------|--------|
| `Pending` | Default when created via POST /orders | orderRouter |
| `Paid` | Set when created via Stripe webhook | webhookRouter |
| `Shipped` | Not implemented | — |
| `Delivered` | Not implemented | — |
| `Canceled` | Not implemented | — |

## Two Order Creation Paths

### Path 1: Direct via /orders (Client-Initiated)

```
Client → POST /orders → Order created (status: "Pending") → Cart deleted
```
The frontend would then separately initiate payment.

### Path 2: Via Stripe Webhook (Payment-Initiated)

```
Client → POST /checkout/create-checkout-session → Stripe Checkout → Payment confirmed
Stripe → POST /webhook/stripe → Order created (status: "Paid") → Cart cleared
```

## Known Issues

1. **No admin order management** — there are no endpoints to view all orders, update order status, or manage fulfillment.
2. **Stock not decremented** — when an order is created, the product stock is not reduced.
3. **Two order paths may conflict** — the webhook path creates orders with `status: "Paid"` using the cart items, while the direct path creates orders with `status: "Pending"`. The frontend should decide which flow to use.
