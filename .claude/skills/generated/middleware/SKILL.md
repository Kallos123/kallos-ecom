---
name: middleware
description: "Skill for the Middleware area of KALLOS. 12 symbols across 3 files."
---

# Middleware

12 symbols | 3 files | Cohesion: 100%

## When to Use

- Working with code in `kallos-backend/`
- Understanding how authenticate, requireAdmin, requireCustomer work
- Modifying middleware-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-backend/src/utils/AppError.ts` | AppError, badRequest, unauthorized, forbidden, notFound (+2) |
| `kallos-backend/src/middleware/authenticate.ts` | authenticate, requireAdmin, requireCustomer |
| `kallos-main/src/app/product/[slug]/page.tsx` | getProduct, ProductPage |

## Entry Points

Start here when exploring this area:

- **`authenticate`** (Function) — `kallos-backend/src/middleware/authenticate.ts:23`
- **`requireAdmin`** (Function) — `kallos-backend/src/middleware/authenticate.ts:51`
- **`requireCustomer`** (Function) — `kallos-backend/src/middleware/authenticate.ts:58`
- **`ProductPage`** (Function) — `kallos-main/src/app/product/[slug]/page.tsx:23`
- **`AppError`** (Class) — `kallos-backend/src/utils/AppError.ts:0`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AppError` | Class | `kallos-backend/src/utils/AppError.ts` | 0 |
| `authenticate` | Function | `kallos-backend/src/middleware/authenticate.ts` | 23 |
| `requireAdmin` | Function | `kallos-backend/src/middleware/authenticate.ts` | 51 |
| `requireCustomer` | Function | `kallos-backend/src/middleware/authenticate.ts` | 58 |
| `ProductPage` | Function | `kallos-main/src/app/product/[slug]/page.tsx` | 23 |
| `badRequest` | Method | `kallos-backend/src/utils/AppError.ts` | 13 |
| `unauthorized` | Method | `kallos-backend/src/utils/AppError.ts` | 17 |
| `forbidden` | Method | `kallos-backend/src/utils/AppError.ts` | 21 |
| `notFound` | Method | `kallos-backend/src/utils/AppError.ts` | 25 |
| `conflict` | Method | `kallos-backend/src/utils/AppError.ts` | 29 |
| `internal` | Method | `kallos-backend/src/utils/AppError.ts` | 33 |
| `getProduct` | Function | `kallos-main/src/app/product/[slug]/page.tsx` | 9 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ProductPage → AppError` | intra_community | 3 |
| `Authenticate → AppError` | intra_community | 3 |
| `RequireAdmin → AppError` | intra_community | 3 |
| `RequireCustomer → AppError` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "authenticate"})` — see callers and callees
2. `gitnexus_query({query: "middleware"})` — find related execution flows
3. Read key files listed above for implementation details
