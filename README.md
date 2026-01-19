# Vinatara Backend – Architecture Overview

Vinatara is an e-commerce platform specialized in selling vintage clothing.  
This backend is built with a modular and layered architecture using Node.js, Express, and MongoDB, designed to be scalable, maintainable, and easy to extend.

## Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** MongoDB  
- **ODM:** Mongoose  
- **Authentication:** JWT (JSON Web Tokens)  
- **Image Storage:** Cloudinary  
- **Roles:** User, Admin  

## Folder Structure


## Architecture Style

The backend follows a **Layered Architecture**:

```text
src/
├── controllers/    # Request handling & business logic
├── routes/         # API route definitions
├── modules/        # Mongoose schemas & models
├── middlewares/    # Auth, role checks, error handling, etc.
├── config/         # Database & Cloudinary configuration
└── app.js          # Express app setup & server entry point
```


Each layer has a clear responsibility:

### 1. Routes Layer (`routes/`)
- Defines all API endpoints.
- Maps HTTP methods and paths to controller functions.
- Example:
  - `/api/auth/login`
  - `/api/products`
  - `/api/users`

### 2. Controllers Layer (`controllers/`)
- Contains the application business logic.
- Receives requests from routes.
- Validates input, applies rules, calls database models, and returns responses.
- Example responsibilities:
  - User registration & login
  - Product creation & listing
  - Order management
  - Admin actions

### 3. Models Layer (`modules/`)
- Defines MongoDB schemas using Mongoose.
- Represents core entities:
  - User
  - Product
  - Order
  - Category
- Handles data structure, validation, and relationships.

### 4. Middleware Layer (`middlewares/`)
- Intercepts requests before they reach controllers.
- Main roles:
  - JWT authentication
  - Role-based authorization (User / Admin)
  - Error handling
  - Request validation

### 5. Config Layer (`config/`)
- Centralizes external services configuration:
  - MongoDB connection
  - Cloudinary setup
  - Environment variables

## Authentication & Authorization Flow

1. User logs in → receives a JWT token.
2. Token is sent in request headers (`Authorization: Bearer <token>`).
3. Auth middleware:
   - Verifies token
   - Extracts user data
   - Attaches user to `req.user`
4. Role middleware:
   - Checks if user is `admin` or `user`
   - Protects admin-only routes (product management, order validation, etc.)


## Key Design Principles

- **Separation of Concerns:** Each folder has a single responsibility.
- **Scalability:** New modules (payments, reviews, shipping) can be added without breaking structure.
- **Security:** JWT-based authentication and role-based access control.
- **Maintainability:** Clean controller–route–model separation.
