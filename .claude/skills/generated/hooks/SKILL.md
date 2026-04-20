---
name: hooks
description: "Skill for the Hooks area of KALLOS. 6 symbols across 5 files."
---

# Hooks

6 symbols | 5 files | Cohesion: 62%

## When to Use

- Working with code in `kallos-main/`
- Understanding how onChange, OrderDetailPage, useIsMobile work
- Modifying hooks-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/hooks/use-mobile.ts` | onChange, useIsMobile |
| `kallos-admin/src/app/admin/settings/page.tsx` | Toggle |
| `kallos-admin/src/app/admin/products/page.tsx` | Checkbox |
| `kallos-admin/src/app/admin/orders/[id]/page.tsx` | OrderDetailPage |
| `kallos-main/src/components/ui/sidebar.tsx` | SidebarProvider |

## Entry Points

Start here when exploring this area:

- **`onChange`** (Function) — `kallos-main/src/hooks/use-mobile.ts:9`
- **`OrderDetailPage`** (Function) — `kallos-admin/src/app/admin/orders/[id]/page.tsx:97`
- **`useIsMobile`** (Function) — `kallos-main/src/hooks/use-mobile.ts:4`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `onChange` | Function | `kallos-main/src/hooks/use-mobile.ts` | 9 |
| `OrderDetailPage` | Function | `kallos-admin/src/app/admin/orders/[id]/page.tsx` | 97 |
| `useIsMobile` | Function | `kallos-main/src/hooks/use-mobile.ts` | 4 |
| `Toggle` | Function | `kallos-admin/src/app/admin/settings/page.tsx` | 87 |
| `Checkbox` | Function | `kallos-admin/src/app/admin/products/page.tsx` | 75 |
| `SidebarProvider` | Function | `kallos-main/src/components/ui/sidebar.tsx` | 55 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 2 calls |
| [id] | 1 calls |
| Users | 1 calls |

## How to Explore

1. `gitnexus_context({name: "onChange"})` — see callers and callees
2. `gitnexus_query({query: "hooks"})` — find related execution flows
3. Read key files listed above for implementation details
