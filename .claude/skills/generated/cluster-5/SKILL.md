---
name: cluster-5
description: "Skill for the Cluster_5 area of KALLOS. 3 symbols across 1 files."
---

# Cluster_5

3 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `kallos-main/`
- Understanding how ApiError, tryRefreshToken, request work
- Modifying cluster_5-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/lib/api.ts` | ApiError, tryRefreshToken, request |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ApiError` | Class | `kallos-main/src/lib/api.ts` | 2 |
| `tryRefreshToken` | Function | `kallos-main/src/lib/api.ts` | 15 |
| `request` | Function | `kallos-main/src/lib/api.ts` | 43 |

## How to Explore

1. `gitnexus_context({name: "ApiError"})` — see callers and callees
2. `gitnexus_query({query: "cluster_5"})` — find related execution flows
3. Read key files listed above for implementation details
