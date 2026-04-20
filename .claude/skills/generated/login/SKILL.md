---
name: login
description: "Skill for the Login area of KALLOS. 4 symbols across 3 files."
---

# Login

4 symbols | 3 files | Cohesion: 86%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how onSubmit, loginAdmin, storeUser work
- Modifying login-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/lib/auth.ts` | loginAdmin, storeUser |
| `kallos-admin/src/app/login/login-form.tsx` | onSubmit |
| `kallos-admin/src/lib/api.ts` | setTokens |

## Entry Points

Start here when exploring this area:

- **`onSubmit`** (Function) — `kallos-admin/src/app/login/login-form.tsx:35`
- **`loginAdmin`** (Function) — `kallos-admin/src/lib/auth.ts:10`
- **`storeUser`** (Function) — `kallos-admin/src/lib/auth.ts:47`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `onSubmit` | Function | `kallos-admin/src/app/login/login-form.tsx` | 35 |
| `loginAdmin` | Function | `kallos-admin/src/lib/auth.ts` | 10 |
| `storeUser` | Function | `kallos-admin/src/lib/auth.ts` | 47 |
| `setTokens` | Function | `kallos-admin/src/lib/api.ts` | 7 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnSubmit → SetTokens` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "onSubmit"})` — see callers and callees
2. `gitnexus_query({query: "login"})` — find related execution flows
3. Read key files listed above for implementation details
