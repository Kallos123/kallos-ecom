---
name: id
description: "Skill for the [id] area of KALLOS. 8 symbols across 4 files."
---

# [id]

8 symbols | 4 files | Cohesion: 65%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how FlashSaleDetailPage, formatDateTime, OrderDetailPage work
- Modifying [id]-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/flash-sales/[id]/page.tsx` | getSaleStatus, getSalePrice, FlashSaleDetailPage |
| `kallos-main/src/app/account/orders/[id]/page.tsx` | formatPrice, formatStatus, OrderDetailPage |
| `kallos-admin/src/app/admin/orders/page.tsx` | OrdersContent |
| `kallos-admin/src/lib/format.ts` | formatDateTime |

## Entry Points

Start here when exploring this area:

- **`FlashSaleDetailPage`** (Function) — `kallos-admin/src/app/admin/flash-sales/[id]/page.tsx:77`
- **`formatDateTime`** (Function) — `kallos-admin/src/lib/format.ts:17`
- **`OrderDetailPage`** (Function) — `kallos-main/src/app/account/orders/[id]/page.tsx:84`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FlashSaleDetailPage` | Function | `kallos-admin/src/app/admin/flash-sales/[id]/page.tsx` | 77 |
| `formatDateTime` | Function | `kallos-admin/src/lib/format.ts` | 17 |
| `OrderDetailPage` | Function | `kallos-main/src/app/account/orders/[id]/page.tsx` | 84 |
| `OrdersContent` | Function | `kallos-admin/src/app/admin/orders/page.tsx` | 42 |
| `getSaleStatus` | Function | `kallos-admin/src/app/admin/flash-sales/[id]/page.tsx` | 57 |
| `getSalePrice` | Function | `kallos-admin/src/app/admin/flash-sales/[id]/page.tsx` | 72 |
| `formatPrice` | Function | `kallos-main/src/app/account/orders/[id]/page.tsx` | 78 |
| `formatStatus` | Function | `kallos-main/src/app/account/orders/[id]/page.tsx` | 81 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Products | 2 calls |
| Users | 2 calls |
| Ui | 2 calls |
| Contexts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "FlashSaleDetailPage"})` — see callers and callees
2. `gitnexus_query({query: "[id]"})` — find related execution flows
3. Read key files listed above for implementation details
