---
name: checkout
description: "Skill for the Checkout area of KALLOS. 5 symbols across 1 files."
---

# Checkout

5 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `kallos-main/`
- Understanding how CheckoutPage, handleRazorpay, setAddr work
- Modifying checkout-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/app/checkout/page.tsx` | formatPrice, loadRazorpayScript, CheckoutPage, handleRazorpay, setAddr |

## Entry Points

Start here when exploring this area:

- **`CheckoutPage`** (Function) — `kallos-main/src/app/checkout/page.tsx:87`
- **`handleRazorpay`** (Function) — `kallos-main/src/app/checkout/page.tsx:204`
- **`setAddr`** (Function) — `kallos-main/src/app/checkout/page.tsx:241`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `CheckoutPage` | Function | `kallos-main/src/app/checkout/page.tsx` | 87 |
| `handleRazorpay` | Function | `kallos-main/src/app/checkout/page.tsx` | 204 |
| `setAddr` | Function | `kallos-main/src/app/checkout/page.tsx` | 241 |
| `formatPrice` | Function | `kallos-main/src/app/checkout/page.tsx` | 65 |
| `loadRazorpayScript` | Function | `kallos-main/src/app/checkout/page.tsx` | 74 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CheckoutPage → LoadRazorpayScript` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "CheckoutPage"})` — see callers and callees
2. `gitnexus_query({query: "checkout"})` — find related execution flows
3. Read key files listed above for implementation details
