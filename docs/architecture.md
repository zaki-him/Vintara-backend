# Vintara Backend Architecture

## Overview

Vintara is an e-commerce backend built with **Node.js** and **Express 5**, using **MongoDB** with **Mongoose** for data persistence. It provides RESTful APIs for authentication, product management, shopping cart, orders, and Stripe-based payment processing.

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime environment |
| Express 5.1.0 | HTTP server and routing |
| MongoDB + Mongoose 8.x | Database and ODM |
| JSON Web Token (JWT) | Stateless authentication |
| bcrypt | Password hashing |
| Cloudinary | Cloud image storage |
| Stripe | Payment processing |
| Multer | Multipart file upload handling |
| body-parser | Raw body parsing for webhooks |
| CORS | Cross-Origin Resource Sharing |
| Nodemon | Development hot-reload |

## Directory Structure

```
/src
  server.js                 # Entry point, mounts routes and middleware
  config/
    db.js                   # MongoDB connection logic
    cloudinary.js           # Cloudinary SDK configuration
  Routers/
    authRouter.js           # POST /sign-up, POST /sign-in
    userRouter.js           # GET/PUT /profile, GET /admin
    productRouter.js        # CRUD /products (admin routes protected)
    cartRouter.js           # GET /, POST /add, DELETE /delete/:productId
    orderRouter.js          # GET /, POST / (create from cart)
    checkoutRouter.js       # POST /create-checkout-session
    webhookRouter.js        # POST /stripe (raw body)
  controllers/
    addUser.js              # Registration logic
    logUser.js              # Login logic
    tokenGenerator.js       # JWT signing utility
  Middlewares/
    protect.js              # JWT verification
    authorizeRoles.js       # Role-based access control
    hashPassword.js         # Mongoose pre-save hook for bcrypt
    multer.js               # Multer memory storage config
  Modules/
    user.js                 # User schema
    product.js              # Product schema
    cart.js                 # Cart schema
    order.js                # Order schema
```

## Layered Architecture

The backend follows a **Routes → Controllers → Models** pattern:

```
HTTP Request
    ↓
server.js (entry, CORS, JSON parsing, route mounting)
    ↓
Routers/ (route definitions, middleware chaining, inline handlers)
    ↓
Middlewares/ (protect, authorizeRoles, multer)
    ↓
Models (Mongoose schemas, validation, pre-save hooks)
    ↓
MongoDB
```

- **Routes** define endpoints, attach middleware, and contain handler logic inline (no separate service layer).
- **Middlewares** intercept requests for authentication, authorization, and file parsing.
- **Models** define schemas with built-in Mongoose validation and lifecycle hooks.

## API Mounting

Routes are mounted in `server.js` in a specific order — the webhook router must be mounted **before** `express.json()` because it requires a raw body:

```javascript
server.use('/webhook', webhookRouter)     // Raw body parser applied inside
server.use(express.json())                 // JSON parser for all other routes
server.use('/auth', authRouter)
server.use('/users', userRouter)
server.use('/products', productRouter)
server.use('/cart', cartRouter)
server.use('/orders', orderRouter)
server.use('/checkout', checkoutRouter)
```

## CORS Configuration

```javascript
server.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))
```

Only `http://localhost:5173` is allowed. Credentials (cookies, Authorization headers) are enabled.

## Key Design Decisions

- **JWT over sessions**: Stateless authentication with 30-day token expiry.
- **Inline route handlers**: Logic lives directly in router files rather than separate controller/service files (except auth controllers).
- **Mongoose validation**: All data validation is Schema-level (required, enum, minlength, maxlength, custom validators).
- **Memory storage for uploads**: Files are buffered in memory then streamed to Cloudinary (no local disk storage).
- **Webhook-first mounting**: `/webhook` is mounted before `express.json()` to preserve the raw body for Stripe signature verification.
- **Express 5**: Uses Express 5.1.0 (pre-release) with async error handling improvements.

## Authentication Flow

```
Client → POST /auth/sign-in → logUser.js → JWT signed with { id, role }
    ↓
Subsequent requests → Authorization: Bearer <token>
    ↓
protect.js middleware → jwt.verify → decoded payload attached to req.user
    ↓
authorizeRoles(['admin']) middleware → checks req.user.role
```

## Payment Flow

```
Client → POST /checkout/create-checkout-session (protected)
    ↓
Stripe Checkout Session created → Client redirected to Stripe
    ↓
Stripe → POST /webhook/stripe (signature verified)
    ↓
checkout.session.completed → Order created → Cart cleared
```

## Change Log

The following bugs have been fixed:

- [#1] **cartRouter.js**: Added missing `mongoose` import, added `Product` import, fixed `Cart.find()` → `Cart.findOne()`, added proper product fetch and stock validation.
- [#2] **cloudinary.js**: Fixed template literal syntax (`{${...}}` → `${...}`).
- [#3] **orderRouter.js**: Fixed `Order.findOne()` → `Order.find()` for GET /orders to return all orders.
- [#4] **webhookRouter.js**: Fixed order items format (now maps to `{ product, quantity }`), added `shippingAddress` fallback, fixed error handling to return 500 on failure.

## Related Documentation

- [API Overview](api-overview.md) — Complete endpoint reference
- [Authentication](auth.md) — JWT, registration, login, role-based access
- [Users](users.md) — Profile management
- [Products](products.md) — CRUD, categories, images, stock
- [Cart](cart.md) — Shopping cart operations
- [Orders](orders.md) — Order lifecycle
- [Checkout](checkout.md) — Stripe payment session
- [Webhooks](webhooks.md) — Stripe event handling
- [Validation](validation.md) — Schema validation rules
- [File Uploads](file-uploads.md) — Multer + Cloudinary
- [Error Handling](error-handling.md) — Response format and status codes
- [Environment Variables](environment-variables.md) — Required .env config
