# Validation

## Overview

Vintara uses **Mongoose schema-level validation** for data integrity. Controllers also include inline manual checks for required fields. There is no dedicated validation library (like Joi or Zod).

## Validation Layers

### Layer 1: Manual Inline Checks (Controllers/Routes)

Controllers perform basic presence checks before interacting with the database.

**Pattern:**
```javascript
if (!name || !email || !password) {
  return res.status(400).json({ message: 'Please enter all fields' })
}
```

**Where used:**
- `src/controllers/addUser.js` — checks `name`, `email`, `password`
- `src/controllers/logUser.js` — checks `email`, `password`
- `src/Routers/productRouter.js` — checks `name`, `prices` on create
- `src/Routers/cartRouter.js` — checks `productId`, `quantity`; validates ObjectId format and positive integer

### Layer 2: Mongoose Schema Validation (Models)

All models define constraints directly in the schema.

#### User (`src/Modules/user.js`)

| Field | Validations |
|-------|-------------|
| `name` | `required: true` |
| `email` | `required`, `unique`, `lowercase`, `trim`, regex: `/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/` |
| `password` | `required`, `min: 8`, `max: 128`, `select: false` |
| `role` | `required`, `enum: ['user', 'admin']`, `default: 'user'` |
| `phone` | `trim` |
| `address` | `trim`, `minlength: 10`, `maxlength: 200` |

#### Product (`src/Modules/product.js`)

| Field | Validations |
|-------|-------------|
| `name` | `required`, `trim`, `minlength: 3`, `maxlength: 100` |
| `description` | `trim`, `maxlength: 1000` |
| `sizes` | Custom validator: must be subset of `['XS','S','M','L','XL','XXL']` |
| `prices` | `required`, `min: 0.01`; Custom validator: max 2 decimal places |
| `category` | `trim`, `enum: ['Clothing','Shoes','Accessories','Bags']` |
| `stock` | `default: 1`, `min: 0`; Custom validator: must be integer |
| `images` | Custom validator: max 5 elements |

#### Cart (`src/Modules/cart.js`)

| Field | Validations |
|-------|-------------|
| `user` | `required`, ObjectId ref to User |
| `items[].product` | `required`, ObjectId ref to Product |
| `items[].quantity` | `default: 1` |

#### Order (`src/Modules/order.js`)

| Field | Validations |
|-------|-------------|
| `user` | `required`, ObjectId ref to User |
| `items[].product` | `required`, ObjectId ref to Product |
| `items[].quantity` | `required` |
| `totalPrice` | `required` |
| `shippingAddress` | `required` |
| `status` | `enum: ['Pending','Paid','Shipped','Delivered','Canceled']`, `default: 'Pending'` |

### Layer 3: Mongoose Schema Hooks (Pre-save)

- **`hashPassword`** (`src/Middlewares/hashPassword.js`): Applied as a pre-save hook on the User schema. Hashes password only if `this.isModified('password')` is true.

## Validation Error Response Format

When Mongoose validation fails, the error is caught by a `try/catch` and returned as:

```json
{
  "error": "Validation error: Product validation failed: name: Path `name` is required."
}
```

## Frontend Validation Reference

Frontend forms should mirror these backend validation rules:

| Field | Rules |
|-------|-------|
| User email | Required, valid email format, unique |
| User password | Required, 8-128 characters |
| User phone | Optional |
| User address | Optional, 10-200 characters |
| Product name | Required, 3-100 characters |
| Product price | Required, > 0, max 2 decimal places |
| Product sizes | Optional, one or more of: XS, S, M, L, XL, XXL |
| Product category | Optional, one of: Clothing, Shoes, Accessories, Bags |
| Product stock | Optional (default 1), non-negative integer |
| Product images | Optional, max 5 files |
| Cart quantity | Required, positive integer |
| Shipping address | Required on order creation, 10-200 characters |
