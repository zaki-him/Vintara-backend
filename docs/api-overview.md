# API Overview

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require a **Bearer JWT token** in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via `POST /auth/sign-in` or `POST /auth/sign-up` and expire in **30 days**.

## Response Format

### Success

```json
{
  "_id": "64a...",
  "name": "John",
  "email": "john@example.com",
  "role": "user",
  "token": "eyJ..."
}
```

### Error

```json
{
  "message": "Description of the error"
}
```

Some errors include:

```json
{
  "error": "Detailed error message from exception"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad Request (validation failure, missing fields) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Endpoint Summary

### Authentication (`/auth`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/sign-up` | No | — | Register a new user |
| POST | `/auth/sign-in` | No | — | Login and receive JWT |

### Users (`/users`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/users/profile` | Yes | Any | Get current user profile (from token) |
| PUT | `/users/profile` | Yes | Any | Update name, address, phone |
| GET | `/users/admin` | Yes | Admin | Admin-only test endpoint |

### Products (`/products`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/products` | No | — | List all products |
| GET | `/products/:id` | No | — | Get single product by ID |
| POST | `/products` | Yes | Admin | Create product (with images) |
| PUT | `/products/:id` | Yes | Admin | Update product (with images) |
| DELETE | `/products/:id` | Yes | Admin | Delete product |

### Cart (`/cart`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/cart` | Yes | Any | Get current user's cart |
| POST | `/cart/add` | Yes | Any | Add item to cart |
| DELETE | `/cart/delete/:productId` | Yes | Any | Remove item from cart |

### Orders (`/orders`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/orders` | Yes | Any | Get user's orders |
| POST | `/orders` | Yes | Any | Create order from cart |

### Checkout (`/checkout`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/checkout/create-checkout-session` | Yes | Any | Create Stripe Checkout session |

### Webhooks (`/webhook`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/webhook/stripe` | No | — | Stripe webhook (raw body) |

## Request/Response Examples

### POST /auth/sign-up

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePass123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/sign-in

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "securePass123"
}
```

**Response (200):**
```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "email": "jane@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /products

**Response (200):**
```json
[
  {
    "_id": "665a...",
    "name": "Classic T-Shirt",
    "description": "A comfortable cotton t-shirt",
    "sizes": ["S", "M", "L"],
    "prices": 29.99,
    "category": "Clothing",
    "stock": 50,
    "images": ["https://res.cloudinary.com/..."],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /cart/add

**Request:**
```json
{
  "productId": "665a...",
  "quantity": 2
}
```

**Response (201):**
```json
{
  "message": "item added to cart"
}
```

### POST /orders

**Request:**
```json
{
  "shippingAddress": "123 Main St, City, Country"
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

## Common Patterns

- **All protected routes** use the `protect` middleware which decodes the JWT and attaches `req.user = { id, role }`.
- **Admin-only routes** use both `protect` and `authorizeRoles(['admin'])`.
- **Request bodies** are parsed as JSON by `express.json()` (except webhooks which use `bodyParser.raw()`).
- **Errors** are returned as JSON objects with either `message` or `error` keys.
