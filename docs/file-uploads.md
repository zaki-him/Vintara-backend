# File Uploads

## Overview

Product images are uploaded via **multipart/form-data**, processed through **Multer** (memory storage), and streamed to **Cloudinary** for cloud storage. No files are stored on the server disk.

## Source Files

| File | Role |
|------|------|
| `src/Middlewares/multer.js` | Multer configuration |
| `src/config/cloudinary.js` | Cloudinary SDK configuration |
| `src/Routers/productRouter.js` | Upload handling in product create/update |

## Multer Configuration

**File:** `src/Middlewares/multer.js`

```javascript
import multer from 'multer'
const storage = multer.memoryStorage()
const upload = multer({ storage })
export default upload
```

- **Storage:** Memory (buffers in RAM, no disk writes).
- **No file size limit** configured.
- **No file type filter** configured.
- Returns `Buffer` objects in `req.files`.

## Cloudinary Configuration

**File:** `src/config/cloudinary.js`

```javascript
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_CLOUD_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_CLOUD_API_SECRET}`
})
export default cloudinary
```

## Upload Flow

### Step 1: Multer Parses the Request

The middleware `upload.array("images", 5)` is applied to the product POST and PUT routes:

```javascript
productRouter.post('/', protect, authorizeRoles(['admin']), upload.array("images", 5), handler)
```

- **Field name:** `images`
- **Max file count:** 5
- **Parsed data:** `req.files` — array of file objects with `buffer`, `originalname`, `mimetype`, `size`, etc.

### Step 2: Stream to Cloudinary

For each file, a Cloudinary upload stream is created:

```javascript
const uploadPromises = req.files.map((file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "Product" },
      (error, results) => {
        if (error) reject(error)
        else resolve(results.secure_url)
      }
    )
    stream.end(file.buffer)
  })
})
const imageURLs = await Promise.all(uploadPromises)
```

- **Cloudinary folder:** `"Product"`
- **Returned data:** `results.secure_url` (HTTPS URL string)

### Step 3: Store URLs in Product

```javascript
const product = new Product({
  name,
  description,
  sizes,
  prices,
  category,
  stock,
  ...(imageURLs && { images: imageURLs })  // Only include if images uploaded
})
```

### Step 4: Update (Replace Images)

On PUT, if new images are uploaded, they **replace** all existing images:

```javascript
const updatedProduct = await Product.findByIdAndUpdate(
  req.params.id,
  { name, description, ..., ...(imageURLs && { images: imageURLs }) },
  { new: true }
)
```

There is no way to delete individual images — only replace the entire array.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_CLOUD_API_KEY` | Cloudinary API key |
| `CLOUDINARY_CLOUD_API_SECRET` | Cloudinary API secret |

## Known Issues

1. **No file validation** — multer is configured without limits or file type filters. Users could upload any file type or extremely large files.
2. **No image deletion on product delete** — when a product is deleted, the associated Cloudinary images remain in the cloud (orphaned assets).
3. **Upload on update replaces all images** — partial image management is not supported.

## Frontend Upload Guidelines

When building the frontend upload form:

```html
<form action="/products" method="POST" enctype="multipart/form-data">
  <input type="text" name="name" required>
  <input type="number" name="prices" step="0.01" required>
  <input type="file" name="images" multiple accept="image/*">
  <!-- other fields -->
</form>
```

- Use `FormData` with `multipart/form-data` content type.
- Include the `Authorization` header for admin access.
- Maximum 5 image files per request.
- Supported image formats depend on Cloudinary's acceptance (no backend filter).
