---
name: flash-sales
description: "Skill for the Flash-sales area of KALLOS. 5 symbols across 1 files."
---

# Flash-sales

5 symbols | 1 files | Cohesion: 67%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how FlashSalesPage, openEdit work
- Modifying flash-sales-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/flash-sales/page.tsx` | getStatus, toDatetimeLocal, pad, FlashSalesPage, openEdit |

## Entry Points

Start here when exploring this area:

- **`FlashSalesPage`** (Function) — `kallos-admin/src/app/admin/flash-sales/page.tsx:59`
- **`openEdit`** (Function) — `kallos-admin/src/app/admin/flash-sales/page.tsx:84`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `FlashSalesPage` | Function | `kallos-admin/src/app/admin/flash-sales/page.tsx` | 59 |
| `openEdit` | Function | `kallos-admin/src/app/admin/flash-sales/page.tsx` | 84 |
| `getStatus` | Function | `kallos-admin/src/app/admin/flash-sales/page.tsx` | 37 |
| `toDatetimeLocal` | Function | `kallos-admin/src/app/admin/flash-sales/page.tsx` | 53 |
| `pad` | Function | `kallos-admin/src/app/admin/flash-sales/page.tsx` | 55 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OpenEdit → Pad` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Products | 1 calls |
| [id] | 1 calls |
| Ui | 1 calls |
| Contexts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "FlashSalesPage"})` — see callers and callees
2. `gitnexus_query({query: "flash-sales"})` — find related execution flows
3. Read key files listed above for implementation details
