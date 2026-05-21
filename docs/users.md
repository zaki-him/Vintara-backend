# Users API

## Overview

User management endpoints — profile retrieval and update. The `role` field distinguishes regular users from administrators.

## Source Files

| File | Role |
|------|------|
| `src/Routers/userRouter.js` | Route definitions for `/users` |
| `src/Modules/user.js` | User Mongoose schema and model |

## User Schema

**File:** `src/Modules/user.js`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | String | Yes | — |
| `email` | String | Yes | Unique, lowercase, regex validation |
| `password` | String | Yes | Min 8, Max 128, `select: false` |
| `role` | String | Yes | Enum: `"user"` (default), `"admin"` |
| `phone` | String | No | Trimmed |
| `address` | String | No | Trimmed, Min 10, Max 200 characters |
| `timestamps` | — | — | `createdAt`, `updatedAt` (auto) |

**Note:** `password` has `select: false`, meaning it is excluded from query results by default. See [auth.md](auth.md) for potential issues with this setting.

## Endpoints

### GET /users/profile (Protected)

Returns the decoded JWT payload (`{ id, role }`) as the user profile. Does **not** fetch user details from the database.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Profile accessed",
  "user": {
    "id": "665a...",
    "role": "user",
    "iat": 1700000000,
    "exp": 1702592000
  }
}
```

### PUT /users/profile (Protected)

Updates the authenticated user's profile fields.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (all fields optional, only provided fields are updated):**
```json
{
  "name": "string",
  "address": "string (10-200 characters)",
  "phone": "string"
}
```

**Response (200):**
```json
{
  "message": "Profile updated"
}
```

**Error (404):**
```json
{
  "message": "User Not Found"
}
```

**Logic:**
1. Find user by `req.user.id` (from JWT).
2. Update only provided fields using nullish coalescing: `user.name = name || user.name`.
3. Save — the pre-save hook checks `isModified('password')`, so password is re-hashed only if changed.

### GET /users/admin (Protected, Admin Only)

Simple admin access test endpoint.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Welcome admin",
  "user": {
    "id": "665a...",
    "role": "admin",
    ...
  }
}
```

**Error (403):**
```json
{
  "message": "Forbiden"
}
```

## Important Notes

- The `GET /users/profile` endpoint returns the **JWT decoded payload**, not the full user document from the database. Frontend should store user data (name, email) from the registration/login response and use this endpoint only for session validation.
- The `PUT /users/profile` endpoint does **not** return the updated user document — only a success message.
- The `role` field cannot be changed via the profile update endpoint (only `name`, `address`, and `phone` are accepted).
