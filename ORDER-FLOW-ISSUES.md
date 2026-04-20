# KALLOS — Order Flow Issues & Pending Decisions

> Created: March 2026
> Status: **On hold — awaiting client decision on shipment creation method**

---

## Current Order Status Flow

```
Order Placed
    │
    ├── COD / Wallet ────────────────────► CONFIRMED
    └── Razorpay ──► PENDING_PAYMENT
                         │
                    Razorpay webhook
                         ▼
                      CONFIRMED
                         │
                   Admin reviews & packs
                         ▼
                      PROCESSING
                         │
                   Admin creates shipment
                         ▼
                       SHIPPED
                         │
                   Delhivery webhook
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       OUT_FOR_DELIVERY         (In Transit → stays SHIPPED)
              │
              ▼
          DELIVERED
```

---

## Known Bugs (Code-Level — Fix Regardless of Client Decision)

### 🔴 1. `createShipment()` skips status history
- **File**: `src/modules/shipping/shipping.service.ts`
- **What happens**: When the Delhivery API successfully creates a shipment, the order's `orderStatus` is updated to `SHIPPED` via a direct `prisma.order.update()` call.
- **Problem**: This bypasses `adminUpdateStatus()`, so **no `OrderStatusHistory` entry is created**. The SHIPPED event is invisible in the admin timeline.
- **Fix**: After getting the waybill back from Delhivery, call `adminUpdateStatus(orderId, 'SHIPPED')` instead of directly updating the order.

---

### 🔴 2. `createShipment()` never sends the shipped email
- **File**: `src/modules/shipping/shipping.service.ts`
- **What happens**: The shipped confirmation email is only triggered inside `adminUpdateStatus()` when `status === 'SHIPPED'`. Since `createShipment()` never calls `adminUpdateStatus()`, **the customer receives no email** when their order is shipped via the API path.
- **Fix**: Same as above — route through `adminUpdateStatus()` after saving tracking info.

---

### 🟡 3. No valid status transition enforcement
- **File**: `src/modules/orders/orders.service.ts` → `adminUpdateStatus()`
- **What happens**: Admin can set any status directly with no guard. E.g. `CONFIRMED → DELIVERED` in one click.
- **Problem**: No enforcement of the logical progression. Easy to accidentally skip stages.
- **Suggested fix**: Define an allowed-transitions map and validate before updating.
  ```ts
  const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    CONFIRMED:        ['PROCESSING', 'CANCELLED'],
    PROCESSING:       ['SHIPPED', 'CANCELLED'],
    SHIPPED:          ['OUT_FOR_DELIVERY', 'DELIVERED'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    // ...
  };
  ```

---

### 🟡 4. Stock is decremented at order placement, not payment confirmation
- **File**: `src/modules/orders/orders.service.ts` → `placeOrder()`
- **What happens**: For Razorpay orders, stock is decremented immediately when the order is placed, before payment is verified. If payment fails, stock stays decremented until manually restored (or order is cancelled).
- **Note**: This is common practice in Indian e-commerce (Razorpay payment window is short, so the risk is low). Acceptable to leave as-is but worth knowing.

---

## Pending Client Decision — Shipment Creation Method

> ⏸ **On hold until client confirms their preferred workflow.**

There are two ways shipments can be registered in the system. Both use Delhivery for physical delivery — the difference is who creates the shipment record:

### Option A — API Auto-Create (existing `POST /orders/:id/ship`)
- Admin clicks "Ship" button in the admin panel
- Backend calls Delhivery API, gets waybill back automatically
- Waybill saved to order, status moves to SHIPPED
- **Pro**: Fully automated, no manual copy-paste
- **Con**: Need to handle label printing separately (Delhivery returns a label URL in the response)
- **Needs**: Fix bugs #1 and #2 above before using this path

### Option B — Manual Waybill Entry (existing `PATCH /orders/:id/tracking`)
- Warehouse staff creates the shipment on Delhivery's own portal/app
- They print the physical label from Delhivery's dashboard
- Admin pastes the waybill number into the KALLOS admin panel
- Backend saves tracking info, admin then advances status to SHIPPED
- **Pro**: Label printing is handled natively by Delhivery's portal
- **Con**: Two-step manual process, more room for human error

### Option C — Hybrid
- Use Delhivery portal for label generation
- But also call the API to register the shipment (so webhook status updates work)

---

## What Delhivery Webhook Already Handles ✅

These status updates come in automatically once a shipment is registered:

| Delhivery Event | Order Status |
|---|---|
| In Transit | SHIPPED (no change) |
| Out for Delivery | OUT_FOR_DELIVERY |
| Delivered | DELIVERED |

Status history entries are created for each webhook event. ✅

---

## Summary — What to Do When Client Decides

| Decision | Action Required |
|---|---|
| Go with **Option A** (API auto-create) | Fix bugs #1 and #2. Optionally add label URL handling. |
| Go with **Option B** (manual entry) | Bugs #1 and #2 are irrelevant (that path won't be used). Just ensure admin UI flow for manual entry + status advance is clean. |
| Go with **Option C** | Fix bugs #1 and #2. |
| Either way | Fix bug #3 (transition enforcement) — independent of shipment method. |
