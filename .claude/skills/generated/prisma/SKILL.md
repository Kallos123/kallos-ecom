---
name: prisma
description: "Skill for the Prisma area of KALLOS. 4 symbols across 1 files."
---

# Prisma

4 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `kallos-backend/`
- Understanding how daysAgo, orderNum, main work
- Modifying prisma-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-backend/prisma/populate.ts` | daysAgo, orderNum, main, createOrder |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `daysAgo` | Function | `kallos-backend/prisma/populate.ts` | 6 |
| `orderNum` | Function | `kallos-backend/prisma/populate.ts` | 12 |
| `main` | Function | `kallos-backend/prisma/populate.ts` | 19 |
| `createOrder` | Function | `kallos-backend/prisma/populate.ts` | 100 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → OrderNum` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "daysAgo"})` — see callers and callees
2. `gitnexus_query({query: "prisma"})` — find related execution flows
3. Read key files listed above for implementation details
