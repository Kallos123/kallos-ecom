---
name: users
description: "Skill for the Users area of KALLOS. 6 symbols across 5 files."
---

# Users

6 symbols | 5 files | Cohesion: 48%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how formatINR, formatDate work
- Modifying users-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/lib/format.ts` | formatINR, formatDate |
| `kallos-admin/src/app/admin/users/page.tsx` | UsersContent |
| `kallos-admin/src/app/admin/returns/page.tsx` | ReturnsContent |
| `kallos-admin/src/app/admin/users/[id]/page.tsx` | OrdersCard |
| `kallos-admin/src/app/admin/products/_components/variants-manager.tsx` | VariantRow |

## Entry Points

Start here when exploring this area:

- **`formatINR`** (Function) — `kallos-admin/src/lib/format.ts:0`
- **`formatDate`** (Function) — `kallos-admin/src/lib/format.ts:9`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatINR` | Function | `kallos-admin/src/lib/format.ts` | 0 |
| `formatDate` | Function | `kallos-admin/src/lib/format.ts` | 9 |
| `UsersContent` | Function | `kallos-admin/src/app/admin/users/page.tsx` | 25 |
| `ReturnsContent` | Function | `kallos-admin/src/app/admin/returns/page.tsx` | 55 |
| `OrdersCard` | Function | `kallos-admin/src/app/admin/users/[id]/page.tsx` | 424 |
| `VariantRow` | Function | `kallos-admin/src/app/admin/products/_components/variants-manager.tsx` | 149 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Products | 3 calls |
| Ui | 1 calls |

## How to Explore

1. `gitnexus_context({name: "formatINR"})` — see callers and callees
2. `gitnexus_query({query: "users"})` — find related execution flows
3. Read key files listed above for implementation details
