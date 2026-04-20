# KALLOS — Feature Audit

> Last updated: March 2026

---

## Legend
- ✅ Full implementation (backend + admin UI)
- 🔧 Backend only (no admin UI)
- 👤 Customer-facing only (no admin surface needed)
- ❌ Not implemented

---

## 1. Authentication

| Feature | Backend | Admin UI |
|---|---|---|
| Register / Login | ✅ | — (no admin needed) |
| OTP verification | ✅ | — |
| Email verification | ✅ | — |
| Forgot / Reset password | ✅ | — |
| JWT refresh tokens | ✅ | — |
| Get own profile | ✅ | — |

---

## 2. Users

| Feature | Backend | Admin UI |
|---|---|---|
| List all users (search, paginate) | ✅ | ✅ |
| Toggle user active/inactive | ✅ | ✅ (switch per row) |
| Email verified badge | ✅ | ✅ |
| Last login / Joined date | ✅ | ✅ |
| Wallet credit/debit | ✅ | ✅ (sheet from row) |
| View user orders | ✅ | ✅ (Orders tab in user detail sheet) |
| Edit user profile (admin) | ✅ | ✅ (Profile tab in user detail sheet) |
| User addresses (admin view) | ✅ | ✅ (Addresses tab in user detail sheet) |

---

## 3. Products

| Feature | Backend | Admin UI |
|---|---|---|
| List products (public, isActive filter) | ✅ | — |
| List all products incl. inactive (admin) | ✅ | ✅ |
| Search / filter by category, subcategory | ✅ | ✅ |
| Create product | ✅ | ✅ |
| Edit product (details, tags, flags) | ✅ | ✅ |
| Delete product | ✅ | ✅ |
| Active / Featured toggles | ✅ | ✅ |
| Product variants (add, edit, delete) | ✅ | ✅ |
| Variant stock adjustment | ✅ | ✅ |
| Product images (upload, reorder, set primary, delete) | ✅ | ✅ |
| Featured products endpoint | ✅ | ❌ (no featured filter in list) |
| Product by slug (storefront) | ✅ | — |
| Low stock / out-of-stock filter | ✅ | ✅ (separate filter chips + count badges) |
| Bulk activate / deactivate | ✅ | ✅ (checkboxes, bulk action bar, confirm dialog) |

---

## 4. Categories & Subcategories

| Feature | Backend | Admin UI |
|---|---|---|
| List categories | ✅ | ✅ |
| Create / Edit / Delete category | ✅ | ✅ |
| List subcategories | ✅ | ✅ |
| Create / Edit / Delete subcategory | ✅ | ✅ |
| Assign subcategory to parent | ✅ | ✅ |
| Category images | ✅ | ✅ (upload/remove in edit sheet, thumbnail in table) |
| Sort order | ✅ | ✅ (drag-to-reorder rows, auto-saved) |

---

## 5. Orders

| Feature | Backend | Admin UI |
|---|---|---|
| List all orders (search, status filter, paginate) | ✅ | ✅ |
| Order detail view | ✅ | ✅ |
| Order items with product snapshot | ✅ | ✅ |
| Order totals (subtotal, shipping, discount, total) | ✅ | ✅ |
| Customer & shipping address on order | ✅ | ✅ |
| Status progression (advance to next status) | ✅ | ✅ |
| Optional note on status change | ✅ | ✅ |
| Status history timeline | ✅ | ✅ |
| Add / update tracking info (courier + waybill) | ✅ | ✅ |
| Payment status & method | ✅ | ✅ |
| Cancel order (admin) | ✅ | ✅ (via status transition) |
| Export orders (CSV/PDF) | ❌ | ❌ |
| Bulk status update | ❌ | ❌ |
| Invoice generation | ❌ | ❌ |

---

## 6. Payments

| Feature | Backend | Admin UI |
|---|---|---|
| Razorpay order creation | ✅ | — |
| Razorpay payment verification | ✅ | — |
| COD support | ✅ | — |
| Wallet payment | ✅ | — |
| Webhook handling (Razorpay) | ✅ | — |
| Payment status visible on order | ✅ | ✅ |
| Manual payment reconciliation | ❌ | ❌ |
| Refund initiation (manual) | ❌ | ❌ |

---

## 7. Returns & Refunds

| Feature | Backend | Admin UI |
|---|---|---|
| List returns (status filter, paginate) | ✅ | ✅ |
| Customer, order, reason, date, amount per row | ✅ | ✅ |
| Approve return (initiates refund) | ✅ | ✅ |
| Reject return | ✅ | ✅ |
| Refund method (Wallet / Original Payment) | ✅ | ✅ (visible) |
| Status flow: Requested → Approved → Picked Up → Completed | ✅ | ❌ (only Approve/Reject in UI, no Picked Up / Completed action) |
| Admin note on return | ✅ (field exists) | ❌ |
| Return images (customer upload) | ✅ (field exists) | ❌ (not displayed) |
| Refund status tracking | ✅ | ❌ (not surfaced) |

---

## 8. Coupons

| Feature | Backend | Admin UI |
|---|---|---|
| List all coupons | ✅ | ✅ |
| Create coupon | ✅ | ✅ |
| Edit coupon | ✅ | ✅ |
| Delete coupon | ✅ | ✅ |
| Types: Percentage, Flat, Free Shipping | ✅ | ✅ |
| Max discount cap (% coupons) | ✅ | ✅ |
| Min order value | ✅ | ✅ |
| Total usage limit / per user limit | ✅ | ✅ |
| Start / end dates | ✅ | ✅ |
| First-time-only flag | ✅ | ✅ |
| Active toggle | ✅ | ✅ |
| Usage count display | ✅ | ✅ |
| Coupon usage history (who used what) | ✅ | ✅ (History sheet per coupon) |

---

## 9. Flash Sales

| Feature | Backend | Admin UI |
|---|---|---|
| List flash sales | ✅ | ✅ |
| Create flash sale | ✅ | ✅ |
| Delete flash sale | ✅ | ✅ |
| Status: Live / Upcoming / Ended / Inactive | ✅ | ✅ |
| Add product to flash sale | ✅ | ✅ |
| Remove product from flash sale | ✅ | ✅ |
| Discount type per product (%, ₹) | ✅ | ✅ |
| Edit flash sale (name, dates, toggle) | ✅ | ✅ (Edit button → sheet) |
| Active toggle on manage page | ✅ | ✅ (toggle in status row) |

---

## 10. Reviews

| Feature | Backend | Admin UI |
|---|---|---|
| List reviews by status (Pending / Approved) | ✅ | ✅ |
| Approve review | ✅ | ✅ |
| Reject review | ✅ | ✅ (Reject button — soft-deletes/rejects, not hard delete) |
| Delete review | ✅ | ✅ |
| Star rating display | ✅ | ✅ |
| Review title & body | ✅ | ✅ |
| Customer name & product name | ✅ | ✅ |
| Review images | ✅ (field exists) | ✅ (displayed in review cards) |
| Pagination | ✅ | ✅ |
| Bulk approve / reject | ✅ | ✅ (context-aware: Approved tab shows only Reject, Rejected tab shows only Approve) |
| Search reviews | ✅ | ✅ |

---

## 11. Wallet

| Feature | Backend | Admin UI |
|---|---|---|
| Get wallet balance | 👤 | — |
| Wallet transaction history | 👤 | — |
| Admin credit/debit | ✅ | ✅ (from Users page) |
| Wallet balance visible per user | ✅ | ✅ (column in Users table + Wallet tab) |

---

## 12. Shipping

| Feature | Backend | Admin UI |
|---|---|---|
| Serviceability check by pincode | ✅ | — |
| Create shipment (Delhivery) | ✅ | ❌ (no UI — done via orders/:id/ship endpoint) |
| Track shipment by waybill | ✅ | — |
| Delhivery webhook (status updates) | ✅ | — |
| Tracking ID entry (manual) | ✅ | ✅ (on order detail page) |
| Auto-create shipment from order | ❌ | ❌ |

---

## 13. Cart & Wishlist

| Feature | Backend | Admin UI |
|---|---|---|
| Cart CRUD (add, update qty, remove, clear) | 👤 | — |
| Wishlist toggle | 👤 | — |
| Cart admin view (list, expand items, subtotal) | ✅ | ✅ |
| Wishlist admin view (list, expand items, stock status) | ✅ | ✅ |

---

## 14. Analytics

| Feature | Backend | Admin UI |
|---|---|---|
| Summary KPIs (revenue, orders, users, pending) | ✅ | ✅ |
| Revenue growth % vs last month | ✅ | ✅ |
| Orders growth % vs last month | ✅ | ✅ |
| Revenue trend (12 months) — area chart | ✅ | ✅ |
| Daily orders (30 days) — bar chart | ✅ | ✅ |
| Top products by revenue | ✅ | ✅ |
| Low stock products | ✅ | ✅ (low stock card in dashboard) |
| Order status breakdown | ✅ | ✅ (horizontal bar breakdown in dashboard) |
| Payment method distribution | ✅ | ✅ (bar distribution in dashboard) |
| Customer growth stats | ✅ | ✅ (total, new this month, top spenders in dashboard) |
| Returns statistics | ✅ | ✅ (total, approved, rejected, rate, approval bar in dashboard) |
| Sales overview (custom date range) | ✅ | ✅ (Today / Week / Month / Year tabs in dashboard) |

---

## 15. Notifications

| Feature | Backend | Admin UI |
|---|---|---|
| List admin notifications | ✅ | ✅ (bell icon in topbar) |
| Mark as read / Mark all read | ✅ | ✅ |
| Delete notification | ✅ | ✅ |
| Notification types: New Order, New Review, New Return | ✅ | ✅ |
| Auto-trigger notifications on events | ❌ | — (notifications must be created manually or via service) |

---

## 16. Admin Settings

| Feature | Backend | Admin UI |
|---|---|---|
| Key-value settings store (DB) | ✅ | ✅ |
| Store name & support email | ✅ | ✅ |
| Maintenance mode toggle | ✅ | ✅ |
| Razorpay / COD / Wallet payment toggles | ✅ | ✅ |
| Free shipping threshold | ✅ | ✅ |
| Return window days | ✅ | ✅ |
| Max cart quantity per item | ✅ | ✅ |
| Low stock threshold | ✅ | ✅ |

---

## Summary

| Area | Status |
|---|---|
| Auth | ✅ Complete |
| Users | ✅ Complete · wallet balance column + detail sheet with Profile/Orders/Addresses/Wallet tabs |
| Products | ✅ Complete |
| Categories | ✅ Complete · image upload, drag-to-reorder |
| Orders | ✅ Complete · ❌ Missing: export, invoice |
| Payments | 🔧 Backend only |
| Returns | ✅ Core done · ❌ Missing: Picked Up / Completed actions, admin note |
| Coupons | ✅ Complete · usage history |
| Flash Sales | ✅ Complete · edit, active toggle |
| Reviews | ✅ Complete · approve/reject, bulk, search, images, pagination |
| Wallet | ✅ Complete · balance column + admin adjust |
| Shipping | 🔧 Backend only · ✅ Manual tracking entry |
| Cart / Wishlist | ✅ Admin read-only view (expandable rows) |
| Analytics | ✅ Complete · all endpoints surfaced in dashboard |
| Notifications | ✅ Complete |
| Admin Settings | ✅ Complete · all 10 settings with grouped UI |
