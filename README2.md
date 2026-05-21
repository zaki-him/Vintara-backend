# Vinatara Backend - Project Architecture

## Overview
Vinatara is an e-commerce platform backend specialized in selling vintage clothing. 
Built with Node.js, Express, and MongoDB, it follows a modular and layered architecture 
designed for scalability, maintainability, and ease of extension.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Image Storage:** Cloudinary
- **Payment Processing:** Stripe
- **Roles:** User, Admin

## Folder Structure
```
src/
├── controllers/    # Request handling & business logic (addUser.js, logUser.js, tokenGenerator.js)
├── Routers/        # API route definitions (authRouter.js, userRouter.js, productRouter.js, cartRouter.js, orderRouter.js, checkoutRouter.js, webhookRouter.js)
├── Modules/        # Mongoose schemas & models (user.js, product.js, order.js, cart.js)
├── Middlewares/    # Custom middleware (protect.js, authorizeRoles.js, hashPassword.js, multer.js)
├── config/         # Configuration files (db.js)
└── server.js       # Express app setup & server entry point
```

## Architecture Style
The backend follows a **Layered Architecture** with strict separation of concerns:

### 1. Routes Layer (`src/Routers/`)
- Defines all API endpoints
- Maps HTTP methods and paths to controller functions
- Example routes: 
  - `/auth/sign-up` (user registration)
  - `/auth/sign-in` (user login)
  - `/users/profile` (user profile)
  - `/products` (product management)
  - `/cart` (shopping cart)
  - `/orders` (order management)
  - `/checkout` (checkout process)
  - `/webhook` (Stripe webhook endpoint)

### 2. Controllers Layer (`src/controllers/`)
- Contains application business logic
- Receives requests from routes
- Validates input, applies rules, calls models, and returns responses
- Key controller files:
  - `addUser.js`: Handles user registration
  - `logUser.js`: Handles user login
  - `tokenGenerator.js`: Generates JWT tokens

### 3. Models Layer (`src/Modules/`)
- Defines MongoDB schemas using Mongoose
- Represents core entities:
  - `user.js`: User schema (includes password hashing middleware)
  - `product.js`: Product schema
  - `order.js`: Order schema
  - `cart.js`: Shopping cart schema
- Handles data structure, validation, and relationships

### 4. Middleware Layer (`src/Middlewares/`)
- Intercepts requests before they reach controllers
- Key middleware components:
  - `protect.js`: JWT authentication middleware
    - Checks Authorization header for Bearer token
    - Verifies token using JWT_SECRET from environment
    - Attaches decoded user data to `req.user`
  - `authorizeRoles.js`: Role-based access control
    - Used with `protect` middleware for admin-protected routes
    - Checks if user has required role (e.g., 'admin')
  - `hashPassword.js`: Password hashing middleware
    - Automatically hashes passwords before saving user documents
  - `multer.js`: File upload handling
    - Configured for Cloudinary image storage

### 5. Config Layer (`src/config/`)
- Centralizes external services configuration:
  - `db.js`: MongoDB connection setup
    - Uses MONGODB_CONFIG environment variable
    - Handles connection errors and process exit on failure

## Authentication & Authorization Flow
1. User logs in via `POST /auth/sign-in` → receives JWT token
2. For protected routes, token sent in request headers: `Authorization: Bearer <token>`
3. Auth middleware (`protect.js`):
   - Extracts token from Authorization header
   - Verifies token using `process.env.JWT_SECRET`
   - On success: attaches decoded user payload to `req.user` and calls `next()`
   - On failure: returns 401/400 error
4. Role middleware (`authorizeRoles.js`):
   - Used in combination with `protect` for role-based access
   - Example: `protect, authorizeRoles(['admin'])` for admin-only routes
   - Checks if `req.user.role` is in the allowed roles array
   - Returns 403 Forbidden if role check fails

## Key Design Principles
- **Separation of Concerns:** Each layer has a single, well-defined responsibility
- **Scalability:** New features (reviews, wishlist, shipping) can be added as new modules without disrupting existing structure
- **Security:** 
  - JWT-based authentication with secret stored in environment variables
  - Role-based access control for admin protection
  - Password hashing using bcrypt
  - Environment variables for sensitive configuration (not committed to repo)
- **Maintainability:** Clear layer boundaries make it easy to locate and modify functionality

## Important Notes & Gotchas
- **File Naming Conventions:**
  - Route files use PascalCase (authRouter.js) but are imported and used as camelCase
  - Middleware directory is named "Middlewares" (plural)
  - Models directory is named "Modules" (plural)
  - Routers directory is named "Routers" (plural)
- **Environment Configuration:**
  - MongoDB connection string stored in `MONGODB_CONFIG` environment variable
  - JWT secret stored in `JWT_SECRET` environment variable
  - Cloudinary credentials stored in `CLOUDINARY_CLOUD_*` variables
  - Stripe keys stored in `STRIPE_API_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
  - All secrets managed via `.env` file (gitignored for security)
- **Server Configuration:**
  - Development server started with `npm run dev` (uses nodemon on src/server.js)
  - Server listens on port 3000 (hardcoded in server.js)
  - CORS configured specifically for `http://localhost:5173` (frontend URL) with credentials enabled
- **Special Endpoints:**
  - Stripe webhook endpoint mounted at `/webhook` at the server level (not under API route prefix)
  - This allows Stripe to deliver webhooks without additional path segments
- **Middleware Order:**
  - In server.js, middleware order matters:
    1. CORS configuration
    2. Webhook router mounted at /webhook (before JSON parsing for Stripe compatibility)
    3. express.json() for parsing JSON bodies
    4. API routers mounted under their respective paths

## Development Workflow
1. Clone repository
2. Create `.env` file with required variables (MONGODB_CONFIG, JWT_SECRET, Cloudinary keys, Stripe keys)
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start development server
5. Server will be available at http://localhost:3000
6. API endpoints accessible under their respective paths (e.g., http://localhost:3000/auth/sign-up)

This architecture provides a solid foundation for building and maintaining a scalable e-commerce backend with clear separation of concerns and security best practices.