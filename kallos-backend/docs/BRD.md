# KALLOS — Business Requirements Document (BRD)

**Version:** 1.0
**Date:** 2026-03-21
**Status:** Draft

---

## 1. Executive Summary

KALLOS is an Indian e-commerce platform selling clothes and accessories. The platform follows a direct-to-consumer (D2C) model with a single admin managing the store. The backend will be built as a RESTful API (versioned as `/api/v1/`) using Node.js, Express, and PostgreSQL, designed to be scalable and professional-grade.

---

## 2. Business Objectives

- Launch a fully functional D2C e-commerce backend for the Indian market
- Support product variants (size, color), inventory tracking, and flexible pricing
- Enable a smooth order lifecycle: browse → cart → checkout → pay → ship → deliver → return/refund
- Provide admin with full control over products, categories, orders, coupons, and analytics
- Build a clean, versioned API that a React frontend can consume

---

## 3. Users & Roles

| Role       | Description                                                                 |
|------------|-----------------------------------------------------------------------------|
| **Customer** | Browse products, manage cart/wishlist, place orders, write reviews, request returns |
| **Admin**    | Single super-admin. Manages products, categories, orders, coupons, analytics |

---

## 4. Authentication & Authorization

### 4.1 Customer Auth
- **Registration:** Email + password (password hashed with bcrypt)
- **Login Options:**
  - Email + password
  - Email OTP (6-digit code sent to email, valid for 5 minutes)
- **Session Management:** JWT-based (access token + refresh token)
  - Access token: short-lived (15 min)
  - Refresh token: long-lived (7 days), stored in DB, rotated on use
- **Password Reset:** Email-based reset link with expiring token

### 4.2 Admin Auth
- Email + password login only
- Separate JWT with admin role claim
- Protected by rate limiting on login endpoint

### 4.3 Security
- Rate limiting on all auth endpoints (brute-force protection)
- Account lockout after repeated failed attempts
- JWT blacklisting on logout
- CORS configured for frontend origin only

---

## 5. Product Management

### 5.1 Categories
- **Hierarchical categories** with parent-child relationships (unlimited depth)
  - Example: `Clothing → Men → T-Shirts → Graphic Tees`
- Admin can create, update, delete, reorder categories
- Each category has: `name`, `slug`, `description`, `image`, `parentId`, `isActive`, `sortOrder`
- Categories are customizable — admin can create any structure

### 5.2 Products
- **Core fields:** `name`, `slug`, `description`, `basePrice`, `categoryId`, `brand`, `material`, `careInstructions`, `isActive`, `isFeatured`
- **Images:** Multiple images per product, stored on Cloudinary. One marked as primary.
- **Tags:** Flexible tagging for search/filtering (e.g., "summer", "casual", "new-arrival")

### 5.3 Product Variants
- Each product can have multiple variants based on **size** and **color**
- Variant fields: `size`, `color`, `colorHex`, `sku` (auto-generated or manual), `price` (override base price if needed), `stock`, `isActive`
- Stock is tracked at the **variant level**
- Example: "Classic White Tee" → `[S/White/50pcs, M/White/30pcs, L/White/20pcs]`

### 5.4 Inventory
- Single warehouse model
- Stock tracked per variant
- Low stock alerts (configurable threshold)
- Stock automatically decremented on order placement
- Stock restored on order cancellation or failed payment

---

## 6. Cart

- **Server-side persistent cart** (syncs across devices)
- Each cart item stores: `productId`, `variantId`, `quantity`
- Cart validates stock availability on add/update
- Cart auto-clears on successful order placement
- Guest users: cart stored locally (frontend), merged on login

---

## 7. Wishlist

- Customers can add/remove products to/from wishlist
- Wishlist is tied to user account (server-side)
- "Move to cart" functionality
- No variant selection needed for wishlist (just the product)

---

## 8. Addresses

- Customers can save **multiple addresses**
- Address fields: `fullName`, `phone`, `addressLine1`, `addressLine2`, `city`, `state`, `pincode`, `isDefault`
- One address can be marked as default
- Customer selects an address during checkout
- Indian pincodes only (6-digit validation)

---

## 9. Orders

### 9.1 Order Lifecycle

```
PLACED → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                                                                    ↓
                                                              RETURN_REQUESTED → RETURN_APPROVED → RETURNED → REFUNDED
PLACED → CANCELLED (by user before shipping)
PLACED → PAYMENT_FAILED
```

### 9.2 Order Details
- **Order fields:** `orderId` (human-readable, e.g., `KAL-20260321-0001`), `userId`, `addressSnapshot` (frozen copy of address at order time), `items[]`, `subtotal`, `discount`, `shippingCharge`, `tax`, `totalAmount`, `paymentMethod`, `paymentStatus`, `orderStatus`, `trackingId`, `courierPartner`
- **Order items:** `productId`, `variantId`, `productSnapshot` (name, image, price at order time), `quantity`, `unitPrice`, `totalPrice`
- Snapshots ensure order history remains accurate even if products/addresses change later

### 9.3 Order Rules
- Minimum order value: configurable by admin
- Maximum quantity per item: configurable
- Stock validation at checkout time
- Order confirmation email sent on successful placement

---

## 10. Payments

### 10.1 Razorpay Integration
- **Payment flow:**
  1. Frontend creates order via API
  2. Backend creates Razorpay order, returns `orderId` + `key`
  3. Frontend completes payment using Razorpay checkout
  4. Backend verifies payment signature via webhook
  5. Order status updated to CONFIRMED
- **Webhook handler** for async payment confirmation
- Signature verification for security

### 10.2 Cash on Delivery (COD)
- Order placed with status CONFIRMED directly
- COD availability can be toggled by admin
- Optional: COD surcharge (configurable)

### 10.3 Payment Statuses
`PENDING → PAID / FAILED / REFUNDED / PARTIALLY_REFUNDED`

---

## 11. Shipping (Delhivery Integration)

- **Order dispatch:** Admin marks order as ready → API creates shipment on Delhivery
- **Tracking:** Fetch tracking info from Delhivery API, expose to customer
- **Webhooks:** Receive delivery status updates from Delhivery
- **Shipping charges:** Configurable (flat rate / weight-based / free above threshold)
- **Serviceability check:** Validate if pincode is serviceable before checkout

---

## 12. Returns, Refunds & Exchanges

### 12.1 Returns
- Customer can request return within configurable window (e.g., 7 days of delivery)
- Return reason required (dropdown: wrong size, defective, not as described, etc.)
- Admin approves/rejects return request
- Delhivery reverse pickup scheduled on approval

### 12.2 Refunds
- Customer chooses refund method at return request time:
  - **Original payment method** (Razorpay refund API)
  - **Store wallet credit** (instant, can be used on future orders)
- Partial refunds supported
- Refund status tracked: `INITIATED → PROCESSING → COMPLETED / FAILED`

### 12.3 Store Wallet
- Each customer has a wallet balance
- Credit added on refund-to-wallet
- Can be applied at checkout (partial or full)
- Wallet transaction history visible to customer

---

## 13. Coupons & Discounts

### 13.1 Coupon Types
| Type | Example |
|------|---------|
| Percentage discount | 20% off |
| Flat discount | ₹200 off |
| Free shipping | Waive shipping charge |

### 13.2 Coupon Rules (all optional, combinable)
- Minimum cart value (e.g., ₹500)
- Maximum discount cap (e.g., 20% off up to ₹300)
- First-time user only
- Valid date range (start → expiry)
- Usage limit (total uses across all users)
- Per-user usage limit
- Applicable categories/products (or all)
- Coupon code (unique string)

### 13.3 Flash Sales
- Admin can schedule flash sales: start time, end time, discounted prices
- Applied at product/variant level
- Overrides regular price during the active window
- Displayed as "sale price" with original price strikethrough

---

## 14. Reviews & Ratings

- Only customers who purchased the product can leave a review
- One review per product per customer (editable)
- Fields: `rating` (1-5 stars), `title`, `body`, `images[]` (optional, Cloudinary)
- Admin can moderate (approve/reject/delete) reviews
- Average rating and review count on product
- Sort reviews by: newest, highest rated, most helpful

---

## 15. Search & Filtering

### 15.1 Full-Text Search
- Search by product name, description, tags, category
- PostgreSQL full-text search (`tsvector` + `tsquery`)
- Search suggestions / autocomplete

### 15.2 Filters
- Category
- Price range (min–max)
- Size
- Color
- Rating (4★ & above, etc.)
- Availability (in stock only)
- Sort by: relevance, price low→high, price high→low, newest, popularity, rating

---

## 16. Notifications (Email)

### Trigger Events
| Event | Recipient |
|-------|-----------|
| Registration welcome | Customer |
| Email OTP | Customer |
| Password reset | Customer |
| Order placed | Customer + Admin |
| Payment confirmed | Customer |
| Order shipped (with tracking) | Customer |
| Order delivered | Customer |
| Return request received | Admin |
| Return approved/rejected | Customer |
| Refund processed | Customer |
| Low stock alert | Admin |

- Email service: Nodemailer with SMTP (or Resend/SendGrid)
- Templated HTML emails

---

## 17. Admin Analytics Dashboard (API)

The backend exposes analytics endpoints for the admin dashboard:

### 17.1 Sales Analytics
- Total revenue (today / this week / this month / custom range)
- Number of orders (with status breakdown)
- Average order value
- Revenue trend (daily/weekly/monthly chart data)

### 17.2 Product Analytics
- Top selling products (by quantity and revenue)
- Low stock products
- Most reviewed / highest rated products
- Products with zero sales

### 17.3 Customer Analytics
- Total registered customers
- New customers (over time)
- Top customers by order value
- Customer retention (repeat orders)

### 17.4 Order Analytics
- Orders by status (pie chart data)
- Return/refund rate
- COD vs online payment split
- Average delivery time

---

## 18. Non-Functional Requirements

### 18.1 Performance
- API response time < 200ms for reads, < 500ms for writes
- Database query optimization with proper indexing
- Redis caching for frequently accessed data (products, categories, cart)

### 18.2 Security
- Rate limiting: 100 req/min general, 10 req/min for auth endpoints
- Input validation & sanitization on all endpoints (Joi/Zod)
- SQL injection prevention (parameterized queries via ORM)
- XSS prevention (output encoding)
- Helmet.js for HTTP security headers
- CORS whitelist
- Request size limits

### 18.3 Scalability
- Stateless API (JWT-based, no server sessions)
- Database connection pooling
- Horizontal scaling ready (Vercel serverless or container-based)
- Background jobs for heavy operations (emails, analytics aggregation)

### 18.4 Reliability
- Database migrations (versioned, reversible)
- Proper error handling with consistent error response format
- Request logging (structured JSON logs)
- Health check endpoint

---

## 19. Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Auth | JWT (access + refresh tokens) |
| Payments | Razorpay |
| Shipping | Delhivery API |
| Image Storage | Cloudinary |
| Email | Nodemailer (SMTP) |
| Validation | Zod |
| Search | PostgreSQL full-text search |
| API Docs | Swagger/OpenAPI |
| Hosting | Vercel |
| Background Jobs | BullMQ (Redis-backed) |

---

## 20. API Versioning

- All endpoints prefixed with `/api/v1/`
- Version in URL path (not headers)
- Breaking changes go into `/api/v2/` when needed

---

## 21. Scope Summary

### In Scope (v1)
- Customer & admin auth (email/password + OTP)
- Product management with variants, categories, images
- Server-side cart & wishlist
- Multi-address management
- Full order lifecycle with status tracking
- Razorpay + COD payments
- Delhivery shipping integration
- Returns, refunds, store wallet
- Coupons, discounts, flash sales
- Reviews & ratings
- Full-text search & filtering
- Email notifications
- Admin analytics APIs
- Rate limiting & security hardening

### Out of Scope (future)
- Multi-vendor / marketplace model
- SMS / push notifications
- Social login (Google, etc.)
- Multi-currency / international shipping
- CMS / banner management from backend
- Mobile app APIs (will work with same API, but no app-specific features)
- Recommendation engine
- Live chat / customer support system

---

## 22. Database Entity Overview

```
Users
├── Addresses
├── Cart → CartItems
├── Wishlist → WishlistItems
├── Orders → OrderItems
├── Reviews
├── Wallet → WalletTransactions
└── RefreshTokens

Products
├── ProductImages
├── ProductVariants
├── ProductTags
└── Reviews

Categories (self-referencing for hierarchy)

Coupons
├── CouponUsage

FlashSales

Orders
├── OrderItems
├── OrderStatusHistory
├── Returns → Refunds

AdminSettings (key-value config store)
```

---

*This BRD will be used as the foundation to design the database schema, API endpoints, and project structure.*
