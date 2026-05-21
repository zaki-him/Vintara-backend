# Vintara Backend - Agent Guide

## Development Commands
- Start dev server: `npm run dev` (uses nodemon on src/server.js)
- Environment: Variables loaded from .env file
- Database: MongoDB connection via src/config/db.js
- Server port: 3000 (hardcoded in server.js)

## Project Structure
- Entry point: `src/server.js`
- Routes: `src/Routers/` (authRouter.js, userRouter.js, productRouter.js, cartRouter.js, orderRouter.js, checkoutRouter.js, webhookRouter.js)
- Controllers: `src/controllers/` (addUser.js, logUser.js, tokenGenerator.js)
- Models: `src/Modules/` (user.js, product.js, order.js, cart.js - Mongoose schemas)
- Middlewares: `src/Middlewares/` (protect.js, authorizeRoles.js, hashPassword.js, multer.js)
- Config: `src/config/` (db.js)

## Architecture Notes
- Layered architecture: Routes → Controllers → Models
- Authentication: JWT via protect.js middleware (checks Authorization header for Bearer token)
- Role checking: authorizeRoles.js middleware (used with protect for admin routes)
- File uploads: multer.js middleware (configured for Cloudinary)
- CORS: Configured for localhost:5173 (frontend) with credentials enabled
- Stripe webhook: Mounted at /webhook (server level, not under route prefix)

## Gotchas
- Route files use PascalCase (authRouter.js) but imported as camelCase
- Middleware directory is named "Middlewares" (plural)
- Models directory is named "Modules" (plural)
- Routers directory is named "Routers" (plural)
- Environment variable for MongoDB: MONGODB_CONFIG
- .env file is gitignored (contains secrets)
- Controllers contain specific functions: addUser (registration), logUser (login), tokenGenerator