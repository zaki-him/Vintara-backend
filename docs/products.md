# Products API

## Overview

Product catalog management — public read endpoints and admin-only CRUD operations with Cloudinary image uploads.

## Source Files

| File | Role |
|------|------|
| `src/Routers/productRouter.js` | Route definitions and handlers |
| `src/Modules/product.js` | Product Mongoose schema and model |
| `src/Middlewares/multer.js` | Multer memory storage config |
| `src/config/cloudinary.js` | Cloudinary SDK configuration |

## Product Schema

**File:** `src/Modules/product.js`

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | String | Yes | Trimmed, 3-100 characters |
| `description` | String | No | Trimmed, max 1000 characters |
| `sizes` | [String] | No | Allowed values: `XS`, `S`, `M`, `L`, `XL`, `XXL` |
| `prices` | Number | Yes | Min 0.01, max 2 decimal places |
| `category` | String | No | Enum: `Clothing`, `Shoes`, `Accessories`, `Bags` |
| `stock` | Number | No | Default: 1, Min: 0, Must be integer |
| `images` | [String] | No | Max 5 URL strings |
| `timestamps` | — | — | `createdAt`, `updatedAt` (auto) |

## Endpoints

### GET /products (Public)

Returns all products.

**Response (200):**
```json
[
  {
    "_id": "665a...",
    "name": "Classic T-Shirt",
    "description": "A comfortable cotton t-shirt",
    "sizes": ["S", "M", "L", "XL"],
    "prices": 29.99,
    "category": "Clothing",
    "stock": 100,
    "images": ["https://res.cloudinary.com/..."],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Note:** No pagination, filtering, or search is implemented. Returns all products in the collection.

### GET /products/:id (Public)

Returns a single product by its MongoDB ObjectId.

**Response (200):**
```json
{
  "product": {
    "_id": "665a...",
    "name": "Classic T-Shirt",
    ...
  }
}
```

**Error (404):**
```json
{
  "message": "Product Not Found"
}
```

### POST /products (Protected, Admin)

Creates a new product with optional image uploads.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data Fields:**
| Field | Type | Required |
|-------|------|----------|
| `name` | String | Yes |
| `description` | String | No |
| `prices` | Number | Yes |
| `sizes` | String[] | No |
| `category` | String | No |
| `stock` | Number | No (default: 1) |
| `images` | File[] | No (max 5 files) |

**Response (201):**
```json
{
  "_id": "665a...",
  "product": { ... }
}
```

**Image Upload Flow:**
1. Multer parses `multipart/form-data` and stores files in **memory** as buffers.
2. Each file buffer is streamed to Cloudinary via `cloudinary.uploader.upload_stream()` with folder: `"Product"`.
3. Returned `secure_url` values are stored in the product's `images` array.
4. If no files are provided, the `images` field is omitted from the document.

### PUT /products/:id (Protected, Admin)

Updates an existing product. Same multipart form-data format as POST.

**Form Data Fields:** Same as POST (all fields optional — only provided fields are updated).

**Image Behavior:**
- If new images are uploaded in the request, they replace all existing images.
- If no images are uploaded, existing images are preserved.
- There is **no way to delete individual images** — only replace all via re-upload.

**Response (200):**
```json
{
  "message": "Product Updated",
  "updatedProduct": { ... }
}
```

**Error (404):**
```json
{
  "message": "Product Not Found"
}
```

### DELETE /products/:id (Protected, Admin)

Deletes a product by ID.

**Response (200):**
```json
{
  "message": "Product deleted",
  "deletedProduct": { ... }
}
```

**Error (404):**
```json
{
  "message": "Product Not Found"
}
```

## Image Upload Details

- **Storage:** Multer memory storage (no local files).
- **Cloudinary folder:** `"Product"`.
- **Max files per request:** 5 (set by `upload.array("images", 5)`).
- **File field name in form:** `images`.
- **Response:** URLs are stored as strings in the product's `images` array.
- **No file type validation:** The backend does not validate MIME types or file extensions.

## Known Issues

- No pagination on `GET /products` — all products returned at once.
- No search or filter capabilities.
- No file size or type validation in multer configuration.
- The `stock` field exists in the schema but is **not checked during cart add** in `cartRouter.js` (the stock check references an undefined variable `product`).
