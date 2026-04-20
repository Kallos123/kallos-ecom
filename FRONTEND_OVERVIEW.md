# KALLOS Frontend — Complete Overview

> **Stack:** Next.js 15 (App Router) · React Query · Framer Motion · Lenis · Tailwind · Bun
> **API Base:** `http://localhost:5000/api/v1` (via `NEXT_PUBLIC_API_URL`)
> **Auth:** JWT Bearer token stored in `localStorage` (`kallos-token`, `kallos-refresh-token`)
> **Port:** `3002` (`bun dev`)

---

## Pages

### `/` — Home
**File:** `src/app/page.tsx` (server component)
**Components:**
- `HeroSection` — static full-screen editorial hero, Framer Motion entrance
- `FeaturedProducts` — `GET /products/featured` → horizontal product cards
- `CategoriesSection` — `GET /categories` → dynamic grid (1/2/3 cols), fallback Unsplash images
- `EditorialSection` — static editorial imagery block
- `CTASection` — static call-to-action banner
- `Header` + `Footer`

---

### `/shop` — Shop / Browse
**File:** `src/app/shop/page.tsx` (client component)
**APIs:**
- `GET /categories` — populate filter sidebar (shared React Query cache)
- `GET /products?categoryId=&sortBy=&limit=` — product grid

**Features:**
- URL params: `?category=<slug>` and `?sort=<value>`
- Category slug → ID resolution via cached categories before query fires
- Sort options: newest, price-asc, price-desc
- Skeleton loading with `animate-pulse`
- `ShopFilters` sidebar with dynamic category links

---

### `/product/[slug]` — Product Detail
**File:** `src/app/product/[slug]/page.tsx` (server component, `revalidate: 60`)
**API:** `GET /products/slug/:slug`

**`ProductDetails` component (client):**
- Variant selector (size buttons, colour swatches) — disables out-of-stock variants
- Flash sale price with strikethrough original price
- `POST /cart/items { variantId, quantity }` — Add to Cart
- `POST /wishlist/:productId/toggle` — heart icon, filled gold if already wishlisted
- Wishlist state from `GET /wishlist` (shared cache)
- Reviews section — up to 5 most recent approved reviews (from product response)
- Material + care instructions accordion

---

### `/search` — Search Results
**File:** `src/app/search/page.tsx` (client component)
**API:** `GET /products?search=<query>&limit=20`
**Features:** `useSearchParams` for query param, renders `ProductCard` grid

---

### `/login` — Sign In
**File:** `src/app/login/page.tsx`
**Auth:** `useAuth().login(email, password)` → `POST /auth/login`
**Layout:** Split — editorial image left, form right
**On success:** redirects to `/account`

---

### `/register` — Register
**File:** `src/app/register/page.tsx`
**Auth:** `useAuth().register(...)` → `POST /auth/register`
**Fields:** First name, Last name, Email, Password, Confirm Password (client-side match validation)
**Layout:** Split — editorial image left, form right

---

### `/forgot-password` — Forgot Password
**File:** `src/app/forgot-password/page.tsx`
**API:** `POST /auth/forgot-password { email }`
**Features:** Success state shows "check your inbox" message

---

### `/cart` — Cart
**File:** `src/app/cart/page.tsx`
**APIs:**
- `GET /cart` — fetch cart (enabled only when logged in)
- `PATCH /cart/items/:id { quantity }` — update quantity
- `DELETE /cart/items/:id` — remove item

**Features:**
- Sign-in prompt if not authenticated
- Skeleton loading
- Quantity +/- controls
- Price breakdown (subtotal)
- "Proceed to Checkout" → `/checkout`

---

### `/wishlist` — Wishlist
**File:** `src/app/wishlist/page.tsx`
**APIs:**
- `GET /wishlist` — fetch wishlist (enabled only when logged in)
- `POST /wishlist/:productId/toggle` — remove item
- `POST /cart/items` — add to cart (uses first in-stock variant)

**Features:**
- Sign-in prompt if not authenticated
- Skeleton loading
- Heart button removes item
- "Add to Bag" uses first in-stock variant

---

### `/checkout` — Checkout
**File:** `src/app/checkout/page.tsx`
**APIs:**
- `GET /users/addresses` — list saved addresses
- `POST /users/addresses` — add new address inline
- `POST /coupons/validate { code, cartSubtotal }` — validate coupon
- `GET /wallet` — wallet balance (shown only if > 0)
- `POST /orders { addressId, paymentMethod, couponCode?, walletAmountToUse }` — create order
- `POST /payments/orders/:orderId/create` — create Razorpay order, returns `{ razorpayOrderId, amount, currency, keyId, orderNumber }`
- `POST /payments/verify { razorpayOrderId, razorpayPaymentId, razorpaySignature }` — verify payment

**Payment Methods:**
| Scenario | `paymentMethod` sent to API |
|---|---|
| Fully paid by wallet | `WALLET` |
| Online only | `RAZORPAY` |
| Online + partial wallet | `RAZORPAY_AND_WALLET` |
| Cash on delivery | `COD` |

**Pricing logic:**
```
subtotal
- coupon discount
+ shipping (₹99 / free if subtotal-discount ≥ ₹999 or coupon.isFreeShipping)
- wallet used (capped at afterDiscount)
= to pay
```

**Razorpay flow:**
1. `POST /orders` → get orderId
2. `POST /payments/orders/:id/create` → get Razorpay order details + keyId
3. Load `checkout.razorpay.com/v1/checkout.js` dynamically
4. Open Razorpay modal with `theme.color: #B4975A`
5. On success → `POST /payments/verify` → redirect to order detail
6. On dismiss → show "Payment cancelled" error, order saved for retry

---

### `/account` — Account Layout
**File:** `src/app/account/layout.tsx`
**Guard:** Redirects to `/login` if not authenticated
**Sidebar nav:** Profile · Orders · Addresses · Wallet · Returns · Sign Out

---

### `/account` — Profile
**File:** `src/app/account/page.tsx`
**APIs:**
- `GET /users/profile` — load profile
- `PATCH /users/profile { firstName, lastName, email }` — save profile
- `PATCH /users/change-password { currentPassword, newPassword }` — change password

**Features:** Two tabs — Personal Info / Change Password

---

### `/account/orders` — Order List
**File:** `src/app/account/orders/page.tsx`
**API:** `GET /orders`
**Features:** Colour-coded status badges (yellow/blue/purple/green/red/orange)

---

### `/account/orders/[id]` — Order Detail
**File:** `src/app/account/orders/[id]/page.tsx`
**APIs:**
- `GET /orders/:id` — order items, pricing, address, status history
- `POST /orders/:id/cancel` — cancel order (PENDING_PAYMENT / CONFIRMED / PROCESSING only)
- `POST /returns/orders/:orderId { reason, description, refundMethod }` — request return (DELIVERED only, within 7 days)

**Features:**
- `?placed=1` query param → green "Order placed successfully!" banner
- Status timeline with gold dot on latest
- Cancellable statuses: `PENDING_PAYMENT`, `CONFIRMED`, `PROCESSING`
- Return reasons: Wrong Size / Wrong Item / Defective / Not as Described / Changed Mind / Other
- Refund methods: Wallet · Original Payment (COD orders → Wallet only)

---

### `/account/addresses` — Addresses
**File:** `src/app/account/addresses/page.tsx`
**APIs:**
- `GET /users/addresses`
- `POST /users/addresses` — add
- `PUT /users/addresses/:id` — edit
- `DELETE /users/addresses/:id` — delete
- `PATCH /users/addresses/:id/default` — set default

**Features:** Inline add/edit form, gold left border on default address

---

### `/account/wallet` — Wallet
**File:** `src/app/account/wallet/page.tsx`
**APIs:**
- `GET /wallet` — balance
- `GET /wallet/transactions` — transaction history

**Features:** Balance card, CREDIT (green ↑) / DEBIT (red ↓) icons per transaction

---

### `/account/returns` — Returns
**File:** `src/app/account/returns/page.tsx`
**API:** `GET /returns/my`
**Features:** Lists all return requests with status badges, links to order detail

---

## Core Infrastructure

### `src/lib/api.ts` — API Client
- Wraps `fetch`, injects `Authorization: Bearer <token>` automatically
- On 401 → auto-refreshes token via `POST /auth/refresh`, retries original request
- On refresh failure → clears tokens, fires `auth:logout` event
- `api.get<T>()`, `api.post<T>()`, `api.patch<T>()`, `api.delete<T>()` — all return `response.data` (unwraps backend envelope)

### `src/lib/auth.ts` — Token Helpers
- `getToken()`, `getRefreshToken()` — read from localStorage
- `storeTokens(access, refresh)` — write to localStorage
- `clearTokens()` — remove both keys

### `src/contexts/auth-context.tsx` — Auth State
- `user` — current user object or null
- `isLoading` — true while checking existing token on mount
- `login(email, password)` — `POST /auth/login`
- `register(data)` — `POST /auth/register`
- `logout()` — `POST /auth/logout` + clearTokens + router push `/`
- Listens to `auth:logout` event (fired by api.ts on refresh failure)

### `src/components/providers/Providers.tsx`
- Wraps app in `QueryClientProvider` (React Query) + `AuthProvider`

### `src/components/providers/LenisProvider.tsx`
- Lenis smooth scroll, synced to Framer Motion

---

## Shared React Query Keys

| Key | Fetches | Used by |
|---|---|---|
| `['categories']` | `GET /categories` | Header, CategoriesSection, ShopFilters (single shared cache) |
| `['cart']` | `GET /cart` | Header (count badge), Cart page, Checkout page |
| `['wishlist']` | `GET /wishlist` | Wishlist page, ProductDetails (heart state) |
| `['products', 'featured']` | `GET /products/featured` | FeaturedProducts |
| `['products', filters]` | `GET /products?...` | Shop page |
| `['product', slug]` | `GET /products/slug/:slug` | Product detail (server-fetched) |
| `['addresses']` | `GET /users/addresses` | Addresses page, Checkout |
| `['wallet']` | `GET /wallet` | Wallet page, Checkout |
| `['orders']` | `GET /orders` | Orders list |
| `['order', id]` | `GET /orders/:id` | Order detail |
| `['returns']` | `GET /returns/my` | Returns page |

---

## Complete API Surface Used

```
Auth
  POST /auth/login
  POST /auth/register
  POST /auth/logout
  POST /auth/refresh
  POST /auth/forgot-password

Users
  GET  /users/profile
  PATCH /users/profile
  PATCH /users/change-password
  GET  /users/addresses
  POST /users/addresses
  PUT  /users/addresses/:id
  DELETE /users/addresses/:id
  PATCH /users/addresses/:id/default

Products
  GET /products/featured
  GET /products                    (?search, ?categoryId, ?sortBy, ?limit)
  GET /products/slug/:slug

Categories
  GET /categories

Cart
  GET /cart
  POST /cart/items                 { variantId, quantity }
  PATCH /cart/items/:id            { quantity }
  DELETE /cart/items/:id

Wishlist
  GET /wishlist
  POST /wishlist/:productId/toggle

Wallet
  GET /wallet
  GET /wallet/transactions

Orders
  GET /orders
  GET /orders/:id
  POST /orders                     { addressId, paymentMethod, couponCode?, walletAmountToUse }
  POST /orders/:id/cancel

Payments
  POST /payments/orders/:orderId/create
  POST /payments/verify            { razorpayOrderId, razorpayPaymentId, razorpaySignature }

Coupons
  POST /coupons/validate           { code, cartSubtotal }

Returns
  GET /returns/my
  POST /returns/orders/:orderId    { reason, description, refundMethod }
```

---

## Design System

| Token | Value |
|---|---|
| `kallos-black` | `#121212` |
| `kallos-ivory` | `#F7F5F0` |
| `kallos-gold` | `#B4975A` |
| `kallos-charcoal` | `#252525` |
| `font-editorial` | Cormorant Garamond |
| Body font | Outfit |
| Border radius | 0 (sharp edges everywhere) |
| Animations | Framer Motion (scroll/entrance), Lenis (smooth scroll) |
| Patterns | parallax · stagger delays · underline-reveal hover · scale on image hover |
