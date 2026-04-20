---
name: layout
description: "Skill for the Layout area of KALLOS. 6 symbols across 3 files."
---

# Layout

6 symbols | 3 files | Cohesion: 72%

## When to Use

- Working with code in `kallos-main/`
- Understanding how logout, Header, onScroll work
- Modifying layout-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/components/layout/Header.tsx` | Header, onScroll, navLinkActive, NavLink |
| `kallos-main/src/contexts/auth-context.tsx` | logout |
| `kallos-main/src/app/account/layout.tsx` | AccountLayout |

## Entry Points

Start here when exploring this area:

- **`logout`** (Function) — `kallos-main/src/contexts/auth-context.tsx:94`
- **`Header`** (Function) — `kallos-main/src/components/layout/Header.tsx:251`
- **`onScroll`** (Function) — `kallos-main/src/components/layout/Header.tsx:277`
- **`AccountLayout`** (Function) — `kallos-main/src/app/account/layout.tsx:18`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `logout` | Function | `kallos-main/src/contexts/auth-context.tsx` | 94 |
| `Header` | Function | `kallos-main/src/components/layout/Header.tsx` | 251 |
| `onScroll` | Function | `kallos-main/src/components/layout/Header.tsx` | 277 |
| `AccountLayout` | Function | `kallos-main/src/app/account/layout.tsx` | 18 |
| `navLinkActive` | Function | `kallos-main/src/components/layout/Header.tsx` | 34 |
| `NavLink` | Function | `kallos-main/src/components/layout/Header.tsx` | 114 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AccountLayout → ClearTokens` | cross_community | 3 |
| `Header → ClearTokens` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Ui | 2 calls |
| Contexts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "logout"})` — see callers and callees
2. `gitnexus_query({query: "layout"})` — find related execution flows
3. Read key files listed above for implementation details
