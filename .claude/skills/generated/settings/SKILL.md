---
name: settings
description: "Skill for the Settings area of KALLOS. 7 symbols across 3 files."
---

# Settings

7 symbols | 3 files | Cohesion: 67%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how DetailsForm, SettingsPage, handleSave work
- Modifying settings-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/app/admin/settings/page.tsx` | SectionCard, setValue, SettingsPage, handleSave |
| `kallos-admin/src/app/admin/products/_components/details-form.tsx` | slugify, DetailsForm |
| `kallos-admin/src/app/admin/users/[id]/page.tsx` | WalletCard |

## Entry Points

Start here when exploring this area:

- **`DetailsForm`** (Function) — `kallos-admin/src/app/admin/products/_components/details-form.tsx:100`
- **`SettingsPage`** (Function) — `kallos-admin/src/app/admin/settings/page.tsx:271`
- **`handleSave`** (Function) — `kallos-admin/src/app/admin/settings/page.tsx:293`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `DetailsForm` | Function | `kallos-admin/src/app/admin/products/_components/details-form.tsx` | 100 |
| `SettingsPage` | Function | `kallos-admin/src/app/admin/settings/page.tsx` | 271 |
| `handleSave` | Function | `kallos-admin/src/app/admin/settings/page.tsx` | 293 |
| `SectionCard` | Function | `kallos-admin/src/app/admin/settings/page.tsx` | 116 |
| `setValue` | Function | `kallos-admin/src/app/admin/settings/page.tsx` | 148 |
| `WalletCard` | Function | `kallos-admin/src/app/admin/users/[id]/page.tsx` | 258 |
| `slugify` | Function | `kallos-admin/src/app/admin/products/_components/details-form.tsx` | 66 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DetailsForm → StoreTokens` | cross_community | 3 |
| `WalletCard → StoreTokens` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Contexts | 2 calls |
| Ui | 2 calls |
| Users | 1 calls |
| Hooks | 1 calls |

## How to Explore

1. `gitnexus_context({name: "DetailsForm"})` — see callers and callees
2. `gitnexus_query({query: "settings"})` — find related execution flows
3. Read key files listed above for implementation details
