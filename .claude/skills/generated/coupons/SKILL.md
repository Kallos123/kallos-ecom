---
name: coupons
description: "Skill for the Coupons area of KALLOS. 4 symbols across 1 files."
---

# Coupons

4 symbols | 1 files | Cohesion: 46%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how CouponsPage, openEdit, openHistory work
- Modifying coupons-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/coupons/page.tsx` | CouponsPage, openEdit, openHistory, numInput |

## Entry Points

Start here when exploring this area:

- **`CouponsPage`** (Function) — `kallos-admin/src/app/admin/coupons/page.tsx:88`
- **`openEdit`** (Function) — `kallos-admin/src/app/admin/coupons/page.tsx:131`
- **`openHistory`** (Function) — `kallos-admin/src/app/admin/coupons/page.tsx:149`
- **`numInput`** (Function) — `kallos-admin/src/app/admin/coupons/page.tsx:184`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CouponsPage` | Function | `kallos-admin/src/app/admin/coupons/page.tsx` | 88 |
| `openEdit` | Function | `kallos-admin/src/app/admin/coupons/page.tsx` | 131 |
| `openHistory` | Function | `kallos-admin/src/app/admin/coupons/page.tsx` | 149 |
| `numInput` | Function | `kallos-admin/src/app/admin/coupons/page.tsx` | 184 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NumInput → StoreTokens` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Contexts | 2 calls |
| Users | 2 calls |
| Products | 1 calls |
| Ui | 1 calls |
| [id] | 1 calls |

## How to Explore

1. `gitnexus_context({name: "CouponsPage"})` — see callers and callees
2. `gitnexus_query({query: "coupons"})` — find related execution flows
3. Read key files listed above for implementation details
