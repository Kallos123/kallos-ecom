---
name: carts
description: "Skill for the Carts area of KALLOS. 4 symbols across 1 files."
---

# Carts

4 symbols | 1 files | Cohesion: 60%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how timeAgo, variantLabel, CartsTab work
- Modifying carts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/carts/page.tsx` | timeAgo, variantLabel, CartsTab, WishlistsTab |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `timeAgo` | Function | `kallos-admin/src/app/admin/carts/page.tsx` | 51 |
| `variantLabel` | Function | `kallos-admin/src/app/admin/carts/page.tsx` | 62 |
| `CartsTab` | Function | `kallos-admin/src/app/admin/carts/page.tsx` | 126 |
| `WishlistsTab` | Function | `kallos-admin/src/app/admin/carts/page.tsx` | 401 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Products | 2 calls |
| Users | 2 calls |

## How to Explore

1. `gitnexus_context({name: "timeAgo"})` — see callers and callees
2. `gitnexus_query({query: "carts"})` — find related execution flows
3. Read key files listed above for implementation details
