# KALLOS Backend — Technical Reference

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [How to Run](#how-to-run)
5. [Database Overview](#database-overview)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Endpoints](#api-endpoints)
8. [Business Logic Notes](#business-logic-notes)
9. [Error Handling](#error-handling)
10. [Utilities](#utilities)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript (strict) |
| Framework | Express 5 |
| Database | PostgreSQL via Prisma v5 ORM |
| Auth | JWT (access + refresh tokens) |
| Payments | Razorpay |
| Shipping | Delhivery |
| Images | Cloudinary |
| Email | Nodemailer (SMTP) |
| Cache/Queue | ioredis + BullMQ (connected, reserved for future use) |
| Validation | Zod |
| Logging | Winston |

---

## Project Structure

```
KALLOS/
├── prisma/
│   ├── schema.prisma          # Full DB schema (30+ models)
│   └── seed.ts                # Seed: admin, customer, categories, products, coupons
├── src/
│   ├── app.ts                 # Express app setup, middleware, routes
│   ├── server.ts              # HTTP server, DB connect, graceful shutdown
│   ├── config/
│   │   ├── database.ts        # Prisma singleton
│   │   ├── env.ts             # Zod-validated env vars (crashes if missing)
│   │   └── redis.ts           # ioredis client (non-fatal if unavailable)
│   ├── middleware/
│   │   ├── authenticate.ts    # JWT verify; requireAdmin / requireCustomer guards
│   │   ├── errorHandler.ts    # Global error handler (Zod, Prisma, AppError, unknown)
│   │   ├── rateLimiter.ts     # generalLimiter (100/min), authLimiter (10/min)
│   │   └── validate.ts        # Zod schema middleware (body/query/params)
│   ├── modules/               # Feature modules (each has service + controller + routes + schema)
│   │   ├── auth/
│   │   ├── analytics/
│   │   ├── cart/
│   │   ├── categories/
│   │   ├── coupons/
│   │   ├── notifications/     # email.service.ts only
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── returns/
│   │   ├── reviews/
│   │   ├── shipping/
│   │   ├── users/
│   │   ├── wallet/
│   │   └── wishlist/
│   └── utils/
│       ├── AppError.ts        # Typed operational errors
│       ├── apiResponse.ts     # sendSuccess / sendCreated helpers
│       ├── asyncHandler.ts    # Eliminates try/catch in controllers
│       ├── logger.ts          # Winston structured logger
│       ├── pagination.ts      # getPagination / buildPaginationMeta
│       └── param.ts           # Safe Express 5 route param extraction
├── docs/
│   ├── BRD.md                 # Business Requirements Document
│   └── BACKEND.md             # This file
└── .env                       # Environment variables (never commit)
```

---

## Environment Variables

All variables are validated with Zod at startup — the server will not start if any are missing.

```env
# Server
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kallos_db?schema=public

# JWT
JWT_SECRET=<long random string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=12

# OTP
OTP_EXPIRES_IN_MINUTES=5

# Password Reset
PASSWORD_RESET_EXPIRES_IN_HOURS=1

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
EMAIL_FROM_NAME=KALLOS
EMAIL_FROM_ADDRESS=noreply@kallos.in

# Delhivery
DELHIVERY_API_KEY=xxx
DELHIVERY_WAREHOUSE_NAME=KALLOS Warehouse
DELHIVERY_RETURN_PINCODE=110001

# Redis
REDIS_URL=redis://localhost:6379

# Shipping thresholds
LOW_STOCK_THRESHOLD=5
LOW_STOCK_ALERT_EMAIL=admin@kallos.in
```

---

## How to Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx ts-node prisma/seed.ts

# Development (with hot reload)
npm run dev

# TypeScript check
npx tsc --noEmit

# Production build
npm run build && npm start
```

**Seed accounts:**
- Admin: `admin@kallos.in` / `Admin@1234`
- Customer: `customer@kallos.in` / `Customer@1234`

---

## Database Overview

### Key Models

| Model | Purpose |
|-------|---------|
| `User` | Customers and admin; has loginAttempts, lockedUntil, isEmailVerified |
| `RefreshToken` | Stored refresh tokens with revocation + rotation support |
| `OtpCode` | Email OTP codes (6-digit, 5min expiry) |
| `PasswordReset` | Reused for both password reset and email verification (prefix `verify_` for verification tokens) |
| `Address` | Multiple addresses per user (isDefault flag) |
| `Category` | Self-referencing tree (parentId); supports nested categories |
| `Product` | Slug-based, with basePrice, tags, isActive, isFeatured |
| `ProductVariant` | SKU + size + color + stock + price override |
| `ProductImage` | Cloudinary URLs with sortOrder |
| `FlashSale` | Time-bounded sale events |
| `FlashSaleItem` | Per-product discount within a flash sale (PERCENTAGE or FLAT) |
| `Cart` / `CartItem` | Persistent server-side cart per user |
| `Wishlist` / `WishlistItem` | Per-user wishlist |
| `Coupon` | Rich coupon rules (see Business Logic) |
| `CouponUsage` | Tracks per-user coupon usage |
| `Order` | Full order lifecycle with status history |
| `OrderItem` | Snapshot of variant/price at order time |
| `OrderStatusHistory` | Immutable log of every status transition |
| `ReturnRequest` | 7-day return window, status machine |
| `Refund` | Linked to return/order; tracks refund method + amount |
| `Wallet` | Per-user store credit wallet |
| `WalletTransaction` | Full ledger: credits, debits, type, reference |
| `Review` | Rating + title + body; requires approval by admin |
| `NotificationLog` | Audit log of sent emails |
| `AdminSetting` | Key-value store for runtime config |

### Enums

`Role`: CUSTOMER, ADMIN
`OrderStatus`: PENDING_PAYMENT, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED, RETURNED
`PaymentStatus`: PENDING, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
`PaymentMethod`: RAZORPAY, COD
`ReturnStatus`: REQUESTED, APPROVED, REJECTED, PICKED_UP, COMPLETED
`RefundStatus`: PENDING, PROCESSED, FAILED
`RefundMethod`: ORIGINAL, WALLET
`CouponType`: PERCENTAGE, FLAT, FREE_SHIPPING
`DiscountType`: PERCENTAGE, FLAT
`WalletTransactionType`: CREDIT, DEBIT

---

## Authentication & Authorization

### Flow

1. **Register** → creates user, cart, wishlist, wallet in one transaction → sends welcome email + email verification email → returns access + refresh tokens
2. **Login** → bcrypt compare → resets loginAttempts → returns tokens
3. **OTP Login** → request OTP (always 200, anti-enumeration) → verify OTP → returns tokens
4. **Refresh** → validates stored refresh token → rotates token (old revoked, new issued) → any token reuse revokes ALL user tokens (reuse detection)
5. **Logout** → revokes the specific refresh token
6. **Forgot Password** → generates reset token (1hr expiry) → sends email
7. **Reset Password** → validates token → updates hash → revokes ALL refresh tokens
8. **Verify Email** → token stored as `verify_<token>` in PasswordReset table → sets `isEmailVerified = true`

### Middleware

```typescript
authenticate       // Verifies JWT; attaches req.user = { id, role }
requireAdmin       // Requires role === ADMIN (use after authenticate)
requireCustomer    // Requires role === CUSTOMER (use after authenticate)
```

### Account Lockout

- 5 failed login attempts → locked for 15 minutes
- `loginAttempts` reset to 0 on successful login

---

## API Endpoints

Base path: `/api/v1`

All protected routes require: `Authorization: Bearer <accessToken>`

---

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register new account |
| POST | `/login` | No | Email + password login |
| POST | `/otp/request` | No | Request OTP to email |
| POST | `/otp/verify` | No | Verify OTP and login |
| POST | `/refresh` | No | Rotate refresh token |
| POST | `/logout` | No | Revoke refresh token |
| POST | `/forgot-password` | No | Send password reset email |
| POST | `/reset-password` | No | Reset password with token |
| GET | `/me` | Customer/Admin | Get current user profile |
| GET | `/verify-email?token=` | No | Verify email address |
| POST | `/resend-verification` | Customer/Admin | Resend verification email |

---

### Users — `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | Customer | Get full profile |
| PATCH | `/profile` | Customer | Update name/phone |
| PATCH | `/password` | Customer | Change password |
| GET | `/addresses` | Customer | List addresses |
| POST | `/addresses` | Customer | Add address |
| PATCH | `/addresses/:id` | Customer | Update address |
| DELETE | `/addresses/:id` | Customer | Delete address |
| PATCH | `/addresses/:id/default` | Customer | Set default address |
| GET | `/admin/all` | Admin | List all users (paginated) |
| PATCH | `/admin/:id/status` | Admin | Activate/deactivate user |

---

### Categories — `/api/v1/categories`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List all categories (tree) |
| POST | `/` | Admin | Create category |
| PATCH | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |

---

### Products — `/api/v1/products`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List products (search, filter, paginate) |
| GET | `/featured` | No | Get featured products |
| GET | `/:idOrSlug` | No | Get product by ID or slug |
| POST | `/` | Admin | Create product |
| PATCH | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/:id/images` | Admin | Upload product images |
| DELETE | `/:id/images/:imageId` | Admin | Delete product image |
| POST | `/:id/variants` | Admin | Add variant |
| PATCH | `/:id/variants/:variantId` | Admin | Update variant (stock, price) |
| DELETE | `/:id/variants/:variantId` | Admin | Delete variant |

**Product list query params:** `search`, `category`, `minPrice`, `maxPrice`, `tags`, `sort` (price_asc/price_desc/newest/featured), `page`, `limit`

**Flash sale prices** are automatically attached to all product responses as `salePrice`, `discountType`, `discountValue` (null if no active sale).

---

### Cart — `/api/v1/cart`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Customer | Get cart with items |
| POST | `/items` | Customer | Add item to cart |
| PATCH | `/items/:itemId` | Customer | Update item quantity |
| DELETE | `/items/:itemId` | Customer | Remove item |
| DELETE | `/` | Customer | Clear cart |

---

### Wishlist — `/api/v1/wishlist`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Customer | Get wishlist |
| POST | `/items` | Customer | Add product to wishlist |
| DELETE | `/items/:productId` | Customer | Remove from wishlist |

---

### Orders — `/api/v1/orders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Customer | Place order (from cart) |
| GET | `/` | Customer | List my orders |
| GET | `/:id` | Customer | Get order details |
| POST | `/:id/cancel` | Customer | Cancel order (before PROCESSING) |
| GET | `/admin/all` | Admin | List all orders (filter by status) |
| GET | `/admin/:id` | Admin | Get any order |
| PATCH | `/admin/:id/status` | Admin | Update order status |
| PATCH | `/admin/:id/tracking` | Admin | Update tracking info |

**Order placement** deducts stock, clears cart, accepts optional `couponCode`. COD orders go straight to CONFIRMED; Razorpay orders start as PENDING_PAYMENT.

---

### Payments — `/api/v1/payments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders/:orderId/razorpay` | Customer | Create Razorpay order |
| POST | `/verify` | Customer | Verify payment signature |
| POST | `/webhook` | No (HMAC) | Razorpay webhook handler |

**Payment flow:**
1. `POST /payments/orders/:orderId/razorpay` → get Razorpay order ID
2. Frontend opens Razorpay modal
3. On success → `POST /payments/verify` with razorpayOrderId, razorpayPaymentId, razorpaySignature
4. Webhook handles async failure/refund events

---

### Shipping — `/api/v1/shipping`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/serviceability/:pincode` | No | Check if pincode is serviceable |
| POST | `/shipments/:orderId` | Admin | Create Delhivery shipment |
| GET | `/track/:waybill` | Customer/Admin | Track shipment |
| POST | `/webhook` | No | Delhivery status webhook |

---

### Returns — `/api/v1/returns`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Customer | Request return (within 7 days of delivery) |
| GET | `/my` | Customer | List my return requests |
| GET | `/admin/all` | Admin | List all returns |
| PATCH | `/admin/:id/approve` | Admin | Approve return |
| PATCH | `/admin/:id/reject` | Admin | Reject return |
| PATCH | `/admin/:id/complete` | Admin | Mark return completed + trigger refund |

---

### Wallet — `/api/v1/wallet`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Customer | Get wallet balance |
| GET | `/transactions` | Customer | List transactions (paginated) |

---

### Reviews — `/api/v1/reviews`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Customer | Submit review (requires delivered order) |
| GET | `/products/:productId` | No | Get approved reviews for product |
| PATCH | `/:id` | Customer | Edit own review (rating/title/body only) |
| DELETE | `/:id` | Customer | Delete own review |
| GET | `/admin/pending` | Admin | List unapproved reviews |
| PATCH | `/admin/:id/approve` | Admin | Approve review |
| DELETE | `/admin/:id` | Admin | Delete any review |

---

### Coupons — `/api/v1/coupons`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Admin | List all coupons (paginated) |
| POST | `/` | Admin | Create coupon |
| PATCH | `/:id` | Admin | Update coupon |
| DELETE | `/:id` | Admin | Delete coupon |
| POST | `/validate` | Customer | Validate coupon for cart |
| GET | `/flash-sales/active` | No | Get currently active flash sales |
| GET | `/flash-sales` | Admin | List all flash sales |
| POST | `/flash-sales` | Admin | Create flash sale |
| DELETE | `/flash-sales/:id` | Admin | Delete flash sale |

---

### Analytics — `/api/v1/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/summary` | Admin | Revenue, orders, users summary |
| GET | `/sales` | Admin | Sales over time (daily/weekly/monthly) |
| GET | `/top-products` | Admin | Top selling products |

---

## Business Logic Notes

### Coupon Rules

Coupons support: minimum order value, maximum discount cap, first-time customers only, total usage limit, per-user usage limit, date range (startDate/endDate).

Types:
- `PERCENTAGE` — discount is `min(cartSubtotal * rate, maxDiscount)`
- `FLAT` — discount is `min(flatAmount, maxDiscount)`
- `FREE_SHIPPING` — sets `isFreeShipping: true` (no monetary discount)

### Flash Sales

Flash sales are time-bounded events. Each item in a flash sale has its own discount (PERCENTAGE or FLAT). The `attachFlashSalePrice` function checks for an active flash sale at query time and appends `salePrice`, `discountType`, `discountValue` to every product response.

### Stock Management

- Stock is tracked per `ProductVariant`
- Placing an order atomically decrements stock; cancellation or return completion increments it back
- When stock falls below `LOW_STOCK_THRESHOLD` env var after an order update, a low stock alert email is sent to `LOW_STOCK_ALERT_EMAIL`

### Refunds

Refunds can go to:
- `ORIGINAL` — back to Razorpay (processed via Razorpay API)
- `WALLET` — instant credit to the user's store wallet

### Refresh Token Security

- Token rotation: every refresh issues a new token and revokes the old one
- Reuse detection: if a revoked token is presented, ALL tokens for that user are revoked (session hijacking protection)

### Email Verification

Verification tokens are stored in the `PasswordReset` table with a `verify_` prefix to distinguish them from password reset tokens. The `verifyEmail` endpoint looks up `verify_${token}`.

---

## Error Handling

All errors flow through `src/middleware/errorHandler.ts`:

| Error Type | HTTP Status | Notes |
|-----------|-------------|-------|
| `ZodError` | 400 | Returns per-field validation errors |
| Prisma P2002 | 409 | Unique constraint violation |
| Prisma P2025 | 404 | Record not found |
| `AppError` | (set by thrower) | Operational errors |
| Unknown | 500 | Generic "Internal server error" |

**AppError static helpers:**
```typescript
AppError.badRequest('msg')    // 400
AppError.unauthorized('msg')  // 401
AppError.forbidden('msg')     // 403
AppError.notFound('msg')      // 404
AppError.conflict('msg')      // 409
AppError.internal('msg')      // 500
```

---

## Utilities

### `param(req, key)`
Safely extracts route params — fixes Express 5's `string | string[]` typing.
```typescript
const id = param(req, 'id'); // always returns string
```

### `asyncHandler(fn)`
Wraps async controller functions — eliminates try/catch boilerplate. Passes errors to `next()`.

### `getPagination(req)` / `buildPaginationMeta(...)`
Reads `page` and `limit` from query string (defaults: page=1, limit=20, max=100). Returns `{ page, limit, skip }` and a `PaginationMeta` object.

### Response format

All responses follow:
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "pagination": { ... }   // only on paginated responses
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]   // only for validation errors
}
```
