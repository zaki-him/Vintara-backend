# Environment Variables

## Overview

The backend uses a `.env` file (gitignored) for configuration. All environment variables are loaded at startup via `dotenv.config()` in `src/server.js`.

## Required Variables

| Variable | Description | Used In | Example |
|----------|-------------|---------|---------|
| `MONGODB_CONFIG` | MongoDB connection string | `src/config/db.js` | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `src/controllers/tokenGenerator.js`, `src/Middlewares/protect.js` | `your-secret-key` |
| `STRIPE_API_SECRET_KEY` | Stripe secret key (starts with `sk_`) | `src/Routers/checkoutRouter.js`, `src/Routers/webhookRouter.js` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (starts with `whsec_`) | `src/Routers/webhookRouter.js` | `whsec_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `src/config/cloudinary.js` | `mycloud` |
| `CLOUDINARY_CLOUD_API_KEY` | Cloudinary API key | `src/config/cloudinary.js` | `123456789` |
| `CLOUDINARY_CLOUD_API_SECRET` | Cloudinary API secret | `src/config/cloudinary.js` | `abc123def456` |

## Optional Variables

None — all variables in `.env` are required for full functionality.

## .env File Format

```env
MONGODB_CONFIG=mongodb+srv://username:password@cluster.mongodb.net/vintara
JWT_SECRET=your-super-secret-key-change-in-production
STRIPE_API_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_API_KEY=123456789
CLOUDINARY_CLOUD_API_SECRET=abc123def456
```

## Loading Order

1. `dotenv.config()` is called at the top of `src/server.js`.
2. `checkoutRouter.js` and `webhookRouter.js` also call `dotenv.config()` redundantly.
3. Cloudinary config is initialized when `src/config/cloudinary.js` is imported.

## Notes

- The `.env` file is **gitignored** and should never be committed.
- Create a `.env.example` file in the repository root with placeholder values for onboarding.
- The MongoDB connection string is stored in `MONGODB_CONFIG` (not the standard `MONGODB_URI`).
- JWT tokens expire in 30 days — the expiry is hardcoded, not configurable via environment.
- The server port is hardcoded to **3000** in `src/server.js` — not configurable via environment.
