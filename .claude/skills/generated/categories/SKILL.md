---
name: categories
description: "Skill for the Categories area of KALLOS. 13 symbols across 2 files."
---

# Categories

13 symbols | 2 files | Cohesion: 86%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how CategoriesPage, openEditCat, openEditSub work
- Modifying categories-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/categories/page.tsx` | slugify, CategoriesPage, openEditCat, openEditSub, handleCatDragStart (+5) |
| `kallos-backend/src/modules/categories/categories.service.ts` | makeSlug, ensureUniqueCategorySlug, ensureUniqueSubcategorySlug |

## Entry Points

Start here when exploring this area:

- **`CategoriesPage`** (Function) — `kallos-admin/src/app/admin/categories/page.tsx:173`
- **`openEditCat`** (Function) — `kallos-admin/src/app/admin/categories/page.tsx:352`
- **`openEditSub`** (Function) — `kallos-admin/src/app/admin/categories/page.tsx:359`
- **`handleCatDragStart`** (Function) — `kallos-admin/src/app/admin/categories/page.tsx:367`
- **`handleCatDragOver`** (Function) — `kallos-admin/src/app/admin/categories/page.tsx:368`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CategoriesPage` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 173 |
| `openEditCat` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 352 |
| `openEditSub` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 359 |
| `handleCatDragStart` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 367 |
| `handleCatDragOver` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 368 |
| `handleCatDrop` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 372 |
| `handleSubDragStart` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 387 |
| `handleSubDragOver` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 388 |
| `handleSubDrop` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 392 |
| `slugify` | Function | `kallos-admin/src/app/admin/categories/page.tsx` | 60 |
| `makeSlug` | Function | `kallos-backend/src/modules/categories/categories.service.ts` | 11 |
| `ensureUniqueCategorySlug` | Function | `kallos-backend/src/modules/categories/categories.service.ts` | 15 |
| `ensureUniqueSubcategorySlug` | Function | `kallos-backend/src/modules/categories/categories.service.ts` | 28 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Products | 1 calls |
| Contexts | 1 calls |
| Settings | 1 calls |
| Ui | 1 calls |

## How to Explore

1. `gitnexus_context({name: "CategoriesPage"})` — see callers and callees
2. `gitnexus_query({query: "categories"})` — find related execution flows
3. Read key files listed above for implementation details
