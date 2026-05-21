# Authentication System

## Overview

Vintara uses **stateless JWT authentication**. Upon successful login or registration, the server returns a JSON Web Token that the client must include in the `Authorization` header of subsequent requests.

## Source Files

| File | Role |
|------|------|
| `src/Routers/authRouter.js` | Route definitions for `/auth/sign-up` and `/auth/sign-in` |
| `src/controllers/addUser.js` | Registration handler |
| `src/controllers/logUser.js` | Login handler |
| `src/controllers/tokenGenerator.js` | JWT signing utility |
| `src/Middlewares/protect.js` | Token verification middleware |
| `src/Middlewares/authorizeRoles.js` | Role-checking middleware |
| `src/Middlewares/hashPassword.js` | Mongoose pre-save hook for password hashing |
| `src/Modules/user.js` | User model with password comparison method |

## Registration (`POST /auth/sign-up`)

**Controller:** `src/controllers/addUser.js`

### Flow

1. Validate `name`, `email`, `password` are present (manual check).
2. Check if user already exists by email (returns 400 if so).
3. Create new `User` document — the `pre("save")` hook in the schema automatically hashes the password using **bcrypt** (salt rounds: 10).
4. Save user to database.
5. Generate JWT using `generateToken(user)`.
6. Return `201` with user data and token.

### Request Body

```json
{
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (required)",
  "role": "string (optional, default: 'user')"
}
```

### Response (201)

```json
{
  "_id": "objectId",
  "name": "string",
  "email": "string",
  "role": "string",
  "token": "jwt_string"
}
```

### Validation (manual in controller)

- All fields required: `name`, `email`, `password`
- Duplicate email check: `User.findOne({ email })`
- Schema-level validation also applies (see [validation.md](validation.md))

## Login (`POST /auth/sign-in`)

**Controller:** `src/controllers/logUser.js`

### Flow

1. Validate `email` and `password` are present.
2. Find user by email (returns 404 if not found).
3. Compare password using `user.comparePassword(password)` which uses **bcrypt.compare**.
4. If password mismatches, return 401.
5. Generate JWT and return 200 with user data and token.

### Request Body

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

### Response (200)

```json
{
  "_id": "objectId",
  "email": "string",
  "token": "jwt_string"
}
```

**Note:** The login response does **not** include `name` or `role` fields.

## Token Generation

**File:** `src/controllers/tokenGenerator.js`

```javascript
jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "30d" }
)
```

- **Algorithm:** HS256 (default)
- **Expiry:** 30 days
- **Payload:** `{ id, role }` — the `id` is the MongoDB `_id`, `role` is either `"user"` or `"admin"`.
- **Secret:** Read from `JWT_SECRET` environment variable.

## Token Verification (protect middleware)

**File:** `src/Middlewares/protect.js`

### Flow

1. Extract `Authorization` header from request.
2. If header is missing or does not start with `"Bearer "`, return 401.
3. Extract token (second part after space).
4. Verify using `jwt.verify(token, process.env.JWT_SECRET)`.
5. If invalid, return 400 with `"Token not valid"`.
6. If valid, attach decoded payload `{ id, role }` to `req.user` and call `next()`.

### Usage

```javascript
import protect from '../Middlewares/protect.js'

router.get('/profile', protect, handler)
```

## Role-Based Authorization

**File:** `src/Middlewares/authorizeRoles.js`

```javascript
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbiden' })
    }
    next()
  }
}
```

The middleware is a **higher-order function** that accepts an array of allowed role strings and returns a middleware function.

### Usage

```javascript
import authorizeRoles from '../Middlewares/authorizeRoles.js'

router.delete('/products/:id', protect, authorizeRoles(['admin']), handler)
```

## Password Hashing

**File:** `src/Middlewares/hashPassword.js`

Applied as a Mongoose **pre-save hook** on the User schema:

```javascript
userSchema.pre("save", hashPassword)
```

- Only hashes if `this.isModified('password')` is true.
- Uses **bcrypt** with salt round **10**.
- Skip logic prevents re-hashing on profile updates.

## User Model Password Comparison

**File:** `src/Modules/user.js` (method on schema)

```javascript
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}
```

- `this.password` is accessible because the pre-save hook has already hashed it.
- The `password` field has `select: false` in the schema, so controllers must explicitly select it if needed (currently, `findOne` returns the password because `select: false` is set — the `logUser.js` controller finds the user without `.select('+password')`, which means **the password field may not be available for comparison**. This is a potential bug.)

**Note:** The schema sets `select: false` on the password field. However, `logUser.js` uses `User.findOne({ email })` without `.select('+password')`, which means the password field will be `undefined` in the returned document, causing `comparePassword` to fail. This is a **known backend bug**.

## Middleware Chaining Examples

### Public Routes

```javascript
authRouter.post('/sign-up', addUser)
```

### Protected Routes (any authenticated user)

```javascript
userRouter.get('/profile', protect, handler)
```

### Protected Routes (admin only)

```javascript
productRouter.post('/', protect, authorizeRoles(['admin']), upload.array("images", 5), handler)
```

## Error Responses

| Scenario | Status | Message |
|----------|--------|---------|
| Missing fields | 400 | `"Please enter all fields"` |
| User already exists | 400 | `"User already exists"` |
| User not found | 404 | `"User not found"` |
| Wrong password | 401 | `"Wrong password"` |
| No token | 401 | `"no token , authorization denied"` |
| Token not valid | 400 | `"Token not valid"` |
| Forbidden role | 403 | `"Forbiden"` (note: typo in source — missing `d`) |
