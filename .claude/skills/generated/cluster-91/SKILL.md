---
name: cluster-91
description: "Skill for the Cluster_91 area of KALLOS. 4 symbols across 1 files."
---

# Cluster_91

4 symbols | 1 files | Cohesion: 75%

## When to Use

- Working with code in `kallos-admin/`
- Understanding how getAccessToken, clearTokens, refreshAccessToken work
- Modifying cluster_91-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-admin/src/lib/api.ts` | getAccessToken, clearTokens, refreshAccessToken, request |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getAccessToken` | Function | `kallos-admin/src/lib/api.ts` | 2 |
| `clearTokens` | Function | `kallos-admin/src/lib/api.ts` | 13 |
| `refreshAccessToken` | Function | `kallos-admin/src/lib/api.ts` | 19 |
| `request` | Function | `kallos-admin/src/lib/api.ts` | 39 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleLogout → ClearTokens` | cross_community | 3 |
| `HandleLogout → ClearTokens` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Login | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getAccessToken"})` — see callers and callees
2. `gitnexus_query({query: "cluster_91"})` — find related execution flows
3. Read key files listed above for implementation details
