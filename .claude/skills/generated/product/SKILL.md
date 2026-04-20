---
name: product
description: "Skill for the Product area of KALLOS. 4 symbols across 2 files."
---

# Product

4 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `kallos-main/`
- Understanding how ProductDetails, formatPrice, ProductCard work
- Modifying product-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/components/product/ProductDetails.tsx` | ProductDetails, formatPrice |
| `kallos-main/src/components/product/ProductCard.tsx` | ProductCard, formatPrice |

## Entry Points

Start here when exploring this area:

- **`ProductDetails`** (Function) — `kallos-main/src/components/product/ProductDetails.tsx:56`
- **`formatPrice`** (Function) — `kallos-main/src/components/product/ProductDetails.tsx:65`
- **`ProductCard`** (Function) — `kallos-main/src/components/product/ProductCard.tsx:22`
- **`formatPrice`** (Function) — `kallos-main/src/components/product/ProductCard.tsx:23`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ProductDetails` | Function | `kallos-main/src/components/product/ProductDetails.tsx` | 56 |
| `formatPrice` | Function | `kallos-main/src/components/product/ProductDetails.tsx` | 65 |
| `ProductCard` | Function | `kallos-main/src/components/product/ProductCard.tsx` | 22 |
| `formatPrice` | Function | `kallos-main/src/components/product/ProductCard.tsx` | 23 |

## How to Explore

1. `gitnexus_context({name: "ProductDetails"})` — see callers and callees
2. `gitnexus_query({query: "product"})` — find related execution flows
3. Read key files listed above for implementation details
