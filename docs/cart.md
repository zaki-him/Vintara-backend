# Cart API

## Overview

Shopping cart management — each user has a single cart document containing an array of product items with quantities.

## Source Files

| File | Role |
|------|------|
| `src/Routers/cartRouter.js` | Route definitions and handlers |
| `src/Modules/cart.js` | Cart Mongoose schema and model |

## Cart Schema

**File:** `src/Modules/cart.js`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `user` | ObjectId (ref: User) | Yes | One cart per user |
| `items` | [Object] | No | Array of cart items |
| `items[].product` | ObjectId (ref: Product) | Yes | Product reference |
| `items[].quantity` | Number | No | Default: 1 |
| `timestamps` | — | — | `createdAt`, `updatedAt` (auto) |

## Data Relationships

```
User (1) ──── Cart (1) ──── Items (N) ──── Product (1)
```

Each user has exactly one cart document. The cart items reference products via ObjectId.

## Endpoints

### GET /cart (Protected)

Returns the current user's cart with populated product data.

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
        "images": ["..."],
        ...
      },
      "quantity": 2,
      "_id": "665a..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

If no cart exists, returns `null` — the handler does not create an empty cart.

### POST /cart/add (Protected)

Adds a product to the cart or increments its quantity if already present.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "productId": "string (required, valid ObjectId)",
  "quantity": "number (required, positive integer)"
}
```

**Validation (in handler):**
- `productId` and `quantity` are required (400 if missing).
- `productId` must be a valid MongoDB ObjectId (400 if invalid).
- `quantity` must be a positive integer (400 if not).

**Response (201):**
```json
{
  "message": "item added to cart"
}
```

**Logic:**
1. Find existing cart for user, or create a new empty cart.
2. Fetch product from database to validate stock.
3. If insufficient stock, return 400 with available count.
4. Check if product already exists in cart items.
5. If exists: increment quantity by provided amount.
6. If new: push `{ product: productId, quantity }` to items array.
7. Save cart.

### DELETE /cart/delete/:productId (Protected)

Removes a product from the cart by its product ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | String | MongoDB ObjectId of the product to remove |

**Response (200):**
```json
{
  "message": "Item deleted from cart"
}
```

**Error (404):**
```json
{
  "message": "Cart not found"
}
```

**Logic:**
1. Find cart for user.
2. Filter out the item whose `product.toString()` matches `productId`.
3. Save cart.

## Known Issues

1. **No cart creation on GET** — if no cart exists, returns `null` instead of an empty cart structure.
