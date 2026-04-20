---
name: admin
description: "Skill for the Admin area of KALLOS. 16 symbols across 5 files."
---

# Admin

16 symbols | 5 files | Cohesion: 94%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how handleLogout, handleLogout, logoutAdmin work
- Modifying admin-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/components/admin/sidebar.tsx` | handleLogout, Sidebar, check, isActive, handleNav |
| `kallos-admin/src/components/admin/topbar.tsx` | handleLogout, Topbar, check |
| `kallos-admin/src/lib/auth.ts` | logoutAdmin, clearUser, getStoredUser |
| `kallos-admin/src/app/admin/page.tsx` | formatINR, RevenueTooltip, DashboardPage |
| `kallos-admin/src/app/admin/layout.tsx` | AdminShell, check |

## Entry Points

Start here when exploring this area:

- **`handleLogout`** (Function) — `kallos-admin/src/components/admin/topbar.tsx:31`
- **`handleLogout`** (Function) — `kallos-admin/src/components/admin/sidebar.tsx:47`
- **`logoutAdmin`** (Function) — `kallos-admin/src/lib/auth.ts:28`
- **`clearUser`** (Function) — `kallos-admin/src/lib/auth.ts:51`
- **`Sidebar`** (Function) — `kallos-admin/src/components/admin/sidebar.tsx:29`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleLogout` | Function | `kallos-admin/src/components/admin/topbar.tsx` | 31 |
| `handleLogout` | Function | `kallos-admin/src/components/admin/sidebar.tsx` | 47 |
| `logoutAdmin` | Function | `kallos-admin/src/lib/auth.ts` | 28 |
| `clearUser` | Function | `kallos-admin/src/lib/auth.ts` | 51 |
| `Sidebar` | Function | `kallos-admin/src/components/admin/sidebar.tsx` | 29 |
| `check` | Function | `kallos-admin/src/components/admin/sidebar.tsx` | 36 |
| `isActive` | Function | `kallos-admin/src/components/admin/sidebar.tsx` | 42 |
| `handleNav` | Function | `kallos-admin/src/components/admin/sidebar.tsx` | 53 |
| `DashboardPage` | Function | `kallos-admin/src/app/admin/page.tsx` | 241 |
| `Topbar` | Function | `kallos-admin/src/components/admin/topbar.tsx` | 17 |
| `check` | Function | `kallos-admin/src/components/admin/topbar.tsx` | 25 |
| `getStoredUser` | Function | `kallos-admin/src/lib/auth.ts` | 36 |
| `formatINR` | Function | `kallos-admin/src/app/admin/page.tsx` | 136 |
| `RevenueTooltip` | Function | `kallos-admin/src/app/admin/page.tsx` | 155 |
| `AdminShell` | Function | `kallos-admin/src/app/admin/layout.tsx` | 7 |
| `check` | Function | `kallos-admin/src/app/admin/layout.tsx` | 12 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleLogout → ClearTokens` | cross_community | 3 |
| `HandleLogout → ClearTokens` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 1 calls |
| Cluster_91 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "handleLogout"})` — see callers and callees
2. `gitnexus_query({query: "admin"})` — find related execution flows
3. Read key files listed above for implementation details
