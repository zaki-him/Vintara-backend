# Error Handling

## Overview

The backend uses a simple error handling approach — try/catch blocks in each handler returning JSON error responses. There is no centralized error handler middleware.

## Error Response Formats

Two response formats are used inconsistently across the codebase:

### Format 1: `message` field

Used for known/expected errors (validation, auth, not found):

```json
{
  "message": "Please enter all fields"
}
```

### Format 2: `error` field

Used for unexpected/server errors (exceptions):

```json
{
  "error": "Cannot read properties of undefined (reading 'stock')"
}
```

## Status Codes by Scenario

| Status Code | Scenario | Message Example |
|-------------|----------|-----------------|
| **200** | Success (GET, PUT, DELETE) | `"Profile updated"` |
| **201** | Created (POST) | `"Order created"` |
| **400** | Bad Request / Validation | `"Please enter all fields"` / `"Empty Cart"` |
| **400** | Invalid token | `"Token not valid"` |
| **401** | Unauthorized | `"no token , authorization denied"` / `"Wrong password"` |
| **403** | Forbidden | `"Forbiden"` (typo in source) |
| **404** | Not Found | `"Product Not Found"` / `"User not found"` |
| **500** | Internal Server Error | `error.message` from catch block |

## Error Handling Pattern

Every route handler follows this pattern:

```javascript
try {
  // business logic
  // success → res.status(xxx).json({ ... })
  // error → res.status(xxx).json({ message: '...' })
} catch (error) {
  res.status(500).json({ error: error.message })
}
```

## Known Issues

1. **Inconsistent error keys** — some responses use `message`, others use `error`. Frontend should check for both.
2. **Typo in authorizeRoles.js** — `"Forbiden"` is misspelled (should be `"Forbidden"`).
3. **No centralized error handler** — Express 5 has built-in async error support, but it's not utilized.
4. **500 errors expose details** — `error.message` is returned in the response, potentially leaking implementation details.
5. **Webhook errors are silent** — errors in the webhook handler are only logged to console; always returns 200.

## Frontend Error Handling Strategy

Recommended approach for handling backend errors:

```javascript
async function apiRequest(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    const errorMessage = data.message || data.error || 'An unexpected error occurred'
    throw new Error(errorMessage)
  }

  return data
}
```
