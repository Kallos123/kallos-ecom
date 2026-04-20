---
name: ui
description: "Skill for the Ui area of KALLOS. 310 symbols across 75 files."
---

# Ui

310 symbols | 75 files | Cohesion: 90%

## When to Use

- Working with code in `kallos-main/`
- Understanding how cn, FormField work
- Modifying ui-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `kallos-main/src/components/ui/sidebar.tsx` | SidebarInset, SidebarInput, SidebarHeader, SidebarFooter, SidebarSeparator (+18) |
| `kallos-main/src/components/ui/menubar.tsx` | Menubar, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem (+6) |
| `kallos-main/src/components/ui/item.tsx` | ItemGroup, ItemSeparator, Item, ItemMedia, ItemContent (+5) |
| `kallos-main/src/components/ui/field.tsx` | FieldSet, FieldLegend, FieldGroup, Field, FieldContent (+5) |
| `kallos-admin/src/components/ui/field.tsx` | FieldSet, FieldLegend, FieldGroup, Field, FieldContent (+5) |
| `kallos-main/src/components/ui/dropdown-menu.tsx` | DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel (+4) |
| `kallos-main/src/components/ui/context-menu.tsx` | ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem (+4) |
| `kallos-admin/src/components/ui/select.tsx` | SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel (+4) |
| `kallos-admin/src/components/ui/dropdown-menu.tsx` | DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSubTrigger, DropdownMenuSubContent (+4) |
| `kallos-main/src/components/ui/table.tsx` | Table, TableHeader, TableBody, TableFooter, TableRow (+3) |

## Entry Points

Start here when exploring this area:

- **`cn`** (Function) — `kallos-main/src/lib/utils.ts:3`
- **`FormField`** (Function) — `kallos-admin/src/components/admin/form-field.tsx:10`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `cn` | Function | `kallos-main/src/lib/utils.ts` | 3 |
| `FormField` | Function | `kallos-admin/src/components/admin/form-field.tsx` | 10 |
| `TooltipContent` | Function | `kallos-main/src/components/ui/tooltip.tsx` | 36 |
| `Toggle` | Function | `kallos-main/src/components/ui/toggle.tsx` | 30 |
| `ToggleGroup` | Function | `kallos-main/src/components/ui/toggle-group.tsx` | 16 |
| `ToggleGroupItem` | Function | `kallos-main/src/components/ui/toggle-group.tsx` | 42 |
| `Textarea` | Function | `kallos-main/src/components/ui/textarea.tsx` | 4 |
| `Tabs` | Function | `kallos-main/src/components/ui/tabs.tsx` | 7 |
| `TabsList` | Function | `kallos-main/src/components/ui/tabs.tsx` | 20 |
| `TabsTrigger` | Function | `kallos-main/src/components/ui/tabs.tsx` | 36 |
| `TabsContent` | Function | `kallos-main/src/components/ui/tabs.tsx` | 52 |
| `Table` | Function | `kallos-main/src/components/ui/table.tsx` | 6 |
| `TableHeader` | Function | `kallos-main/src/components/ui/table.tsx` | 21 |
| `TableBody` | Function | `kallos-main/src/components/ui/table.tsx` | 31 |
| `TableFooter` | Function | `kallos-main/src/components/ui/table.tsx` | 41 |
| `TableRow` | Function | `kallos-main/src/components/ui/table.tsx` | 54 |
| `TableHead` | Function | `kallos-main/src/components/ui/table.tsx` | 67 |
| `TableCell` | Function | `kallos-main/src/components/ui/table.tsx` | 80 |
| `TableCaption` | Function | `kallos-main/src/components/ui/table.tsx` | 93 |
| `Switch` | Function | `kallos-main/src/components/ui/switch.tsx` | 7 |

## How to Explore

1. `gitnexus_context({name: "cn"})` — see callers and callees
2. `gitnexus_query({query: "ui"})` — find related execution flows
3. Read key files listed above for implementation details
