---
name: products
description: "Skill for the Products area of KALLOS. 20 symbols across 8 files."
---

# Products

20 symbols | 8 files | Cohesion: 77%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how CartPage, AddressesPage, set work
- Modifying products-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/products/page.tsx` | totalStock, ProductsContent, setParentCat, toggleOne |
| `kallos-backend/src/modules/products/products.service.ts` | delete, makeSlug, ensureUniqueSlug |
| `kallos-admin/src/app/admin/reviews/page.tsx` | ReviewsContent, executeBulk, toggleOne |
| `kallos-admin/src/components/admin/notifications-bell.tsx` | timeAgo, NotificationsBell, handleClick |
| `kallos-main/src/app/cart/page.tsx` | formatPrice, CartPage |
| `kallos-main/src/app/account/addresses/page.tsx` | AddressesPage, set |
| `kallos-admin/src/app/admin/carts/page.tsx` | CartsPageContent, setTab |
| `kallos-admin/src/app/admin/products/_components/images-manager.tsx` | ImagesManager |

## Entry Points

Start here when exploring this area:

- **`CartPage`** (Function) — `kallos-main/src/app/cart/page.tsx:38`
- **`AddressesPage`** (Function) — `kallos-main/src/app/account/addresses/page.tsx:24`
- **`set`** (Function) — `kallos-main/src/app/account/addresses/page.tsx:64`
- **`NotificationsBell`** (Function) — `kallos-admin/src/components/admin/notifications-bell.tsx:37`
- **`handleClick`** (Function) — `kallos-admin/src/components/admin/notifications-bell.tsx:75`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CartPage` | Function | `kallos-main/src/app/cart/page.tsx` | 38 |
| `AddressesPage` | Function | `kallos-main/src/app/account/addresses/page.tsx` | 24 |
| `set` | Function | `kallos-main/src/app/account/addresses/page.tsx` | 64 |
| `NotificationsBell` | Function | `kallos-admin/src/components/admin/notifications-bell.tsx` | 37 |
| `handleClick` | Function | `kallos-admin/src/components/admin/notifications-bell.tsx` | 75 |
| `ImagesManager` | Function | `kallos-admin/src/app/admin/products/_components/images-manager.tsx` | 30 |
| `delete` | Method | `kallos-backend/src/modules/products/products.service.ts` | 277 |
| `formatPrice` | Function | `kallos-main/src/app/cart/page.tsx` | 35 |
| `ReviewsContent` | Function | `kallos-admin/src/app/admin/reviews/page.tsx` | 48 |
| `executeBulk` | Function | `kallos-admin/src/app/admin/reviews/page.tsx` | 106 |
| `toggleOne` | Function | `kallos-admin/src/app/admin/reviews/page.tsx` | 134 |
| `CartsPageContent` | Function | `kallos-admin/src/app/admin/carts/page.tsx` | 634 |
| `setTab` | Function | `kallos-admin/src/app/admin/carts/page.tsx` | 640 |
| `timeAgo` | Function | `kallos-admin/src/components/admin/notifications-bell.tsx` | 29 |
| `totalStock` | Function | `kallos-admin/src/app/admin/products/page.tsx` | 47 |
| `ProductsContent` | Function | `kallos-admin/src/app/admin/products/page.tsx` | 101 |
| `setParentCat` | Function | `kallos-admin/src/app/admin/products/page.tsx` | 126 |
| `toggleOne` | Function | `kallos-admin/src/app/admin/products/page.tsx` | 193 |
| `makeSlug` | Function | `kallos-backend/src/modules/products/products.service.ts` | 17 |
| `ensureUniqueSlug` | Function | `kallos-backend/src/modules/products/products.service.ts` | 21 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ProductsContent → Delete` | intra_community | 3 |
| `ReviewsContent → Delete` | intra_community | 3 |
| `CartsPageContent → Delete` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Users | 2 calls |
| Ui | 2 calls |

## How to Explore

1. `gitnexus_context({name: "CartPage"})` — see callers and callees
2. `gitnexus_query({query: "products"})` — find related execution flows
3. Read key files listed above for implementation details
