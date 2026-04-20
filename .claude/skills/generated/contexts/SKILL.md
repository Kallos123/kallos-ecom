---
name: contexts
description: "Skill for the Contexts area of KALLOS. 12 symbols across 7 files."
---

# Contexts

12 symbols | 7 files | Cohesion: 66%

## When to Use

- Working with code in `kallos-main/`
- Understanding how storeTokens, login, register work
- Modifying contexts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/lib/auth.ts` | storeTokens, getToken, clearTokens, isLoggedIn |
| `kallos-main/src/contexts/auth-context.tsx` | login, register, AuthProvider |
| `kallos-main/src/app/register/page.tsx` | handleSubmit |
| `kallos-main/src/app/login/page.tsx` | handleSubmit |
| `kallos-admin/src/app/login/login-form.tsx` | LoginForm |
| `kallos-admin/src/app/admin/users/[id]/page.tsx` | ProfileCard |
| `kallos-admin/src/app/admin/products/_components/variants-manager.tsx` | AddVariantForm |

## Entry Points

Start here when exploring this area:

- **`storeTokens`** (Function) — `kallos-main/src/lib/auth.ts:19`
- **`login`** (Function) — `kallos-main/src/contexts/auth-context.tsx:69`
- **`register`** (Function) — `kallos-main/src/contexts/auth-context.tsx:79`
- **`handleSubmit`** (Function) — `kallos-main/src/app/register/page.tsx:24`
- **`handleSubmit`** (Function) — `kallos-main/src/app/login/page.tsx:16`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `storeTokens` | Function | `kallos-main/src/lib/auth.ts` | 19 |
| `login` | Function | `kallos-main/src/contexts/auth-context.tsx` | 69 |
| `register` | Function | `kallos-main/src/contexts/auth-context.tsx` | 79 |
| `handleSubmit` | Function | `kallos-main/src/app/register/page.tsx` | 24 |
| `handleSubmit` | Function | `kallos-main/src/app/login/page.tsx` | 16 |
| `LoginForm` | Function | `kallos-admin/src/app/login/login-form.tsx` | 19 |
| `getToken` | Function | `kallos-main/src/lib/auth.ts` | 9 |
| `clearTokens` | Function | `kallos-main/src/lib/auth.ts` | 24 |
| `isLoggedIn` | Function | `kallos-main/src/lib/auth.ts` | 29 |
| `AuthProvider` | Function | `kallos-main/src/contexts/auth-context.tsx` | 35 |
| `ProfileCard` | Function | `kallos-admin/src/app/admin/users/[id]/page.tsx` | 124 |
| `AddVariantForm` | Function | `kallos-admin/src/app/admin/products/_components/variants-manager.tsx` | 42 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DetailsForm → StoreTokens` | cross_community | 3 |
| `LoginForm → StoreTokens` | intra_community | 3 |
| `HandleSubmit → StoreTokens` | intra_community | 3 |
| `WalletCard → StoreTokens` | cross_community | 3 |
| `AccountLayout → ClearTokens` | cross_community | 3 |
| `HandleSubmit → StoreTokens` | intra_community | 3 |
| `ProfileCard → StoreTokens` | intra_community | 3 |
| `Header → ClearTokens` | cross_community | 3 |
| `AddVariantForm → StoreTokens` | intra_community | 3 |
| `NumInput → StoreTokens` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 3 calls |
| Users | 1 calls |

## How to Explore

1. `gitnexus_context({name: "storeTokens"})` — see callers and callees
2. `gitnexus_query({query: "contexts"})` — find related execution flows
3. Read key files listed above for implementation details
