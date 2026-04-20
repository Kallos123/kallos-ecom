# KALLOS Admin Panel — Frontend

Next.js 16 admin panel for the KALLOS D2C e-commerce platform.

---

## Ports

| Service      | Port   | URL                              |
| ------------ | ------ | -------------------------------- |
| Backend API  | `3000` | http://localhost:3000/api/v1     |
| Admin Panel  | `3001` | http://localhost:3001            |

---

## Running Locally

### 1. Start the backend

```bash
cd kallos-backend
npm run dev
# Runs on http://localhost:3000
```

### 2. Start the admin panel

```bash
cd kallos-admin
npm run dev
# Runs on http://localhost:3001
```

Both must be running at the same time. Open http://localhost:3001/login in your browser.

---

## Environment

**`kallos-admin/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**`kallos-backend/.env`** — key values:
```
PORT=3000
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://postgres:123456@localhost:5432/kallos_db
```

---

## Tech Stack

| Layer         | Choice                                    |
| ------------- | ----------------------------------------- |
| Framework     | Next.js 16.2.1 (App Router, TypeScript)   |
| Styling       | Tailwind v4 + Shadcn `base-nova`          |
| Components    | `@base-ui/react` (Shadcn primitive layer) |
| Server state  | TanStack Query v5                         |
| Forms         | React Hook Form + Zod                     |
| Charts        | Recharts                                  |
| Toasts        | Sonner                                    |
| Icons         | Lucide React                              |

---

## Pages

| Route                         | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| `/login`                      | Admin login (JWT, redirects if already logged in)         |
| `/admin`                      | Dashboard — stat cards, revenue chart, top products       |
| `/admin/orders`               | Orders list with status filter tabs, search, pagination   |
| `/admin/orders/[id]`          | Order detail — status updates, items, timeline, tracking  |
| `/admin/products`             | Products list with stock badges, category filter          |
| `/admin/products/new`         | Create new product                                        |
| `/admin/products/[id]`        | Edit product — tabs: Details / Variants / Images          |
| `/admin/categories`           | Category tree (parent + children) with create/edit Sheet  |
| `/admin/returns`              | Returns list with inline approve/reject/complete actions  |
| `/admin/reviews`              | Review moderation — Pending and Approved tabs             |
| `/admin/coupons`              | Coupons table with full create/edit Sheet                 |
| `/admin/flash-sales`          | Flash sales list                                          |
| `/admin/flash-sales/[id]`     | Flash sale detail — assign products with discounts        |
| `/admin/users`                | Users list with active toggle + wallet adjustment Sheet   |
| `/admin/analytics`            | Revenue chart, daily orders chart, top 10 products        |

---

## Key Implementation Notes

### Auth flow
- Access token stored in `localStorage`, sent as `Authorization: Bearer <token>`
- On 401, the API client auto-refreshes using the refresh token
- A `kallos_session` cookie is set on login so the Next.js proxy (`proxy.ts`) can gate routes without accessing localStorage
- `/admin/*` routes redirect to `/login` if the cookie is absent
- `/login` redirects to `/admin` if the cookie is present

### Design system
- Always-dark theme — KALLOS brand colors: near-black `oklch(0.085 0 0)` + crimson `oklch(0.52 0.20 18)`
- Typography: Cormorant Garamond (display), JetBrains Mono (data/labels), Geist (body)
- Sharp corners throughout (`--radius: 0.25rem`)
- Noise grain texture overlay on body

### Patterns used across every page
- Table list + `Sheet` side panel for create/edit (no separate routes)
- `Skeleton` rows during loading
- Hover-reveal action buttons (`opacity-0 group-hover:opacity-100`)
- `Badge` for all status indicators
- `confirm()` for delete confirmations
- Pages using `useSearchParams` are wrapped in `<Suspense>`

### Form numbers
`z.number()` + `register("field", { valueAsNumber: true })` — do **not** use `z.coerce.number()`, it conflicts with `zodResolver` type inference.

### Flash sale product assignment
After creating a flash sale, click **Manage** on the row to open the detail page where you can assign products with per-product discounts (% or flat).

### Wallet adjustment
On the Users page, hover any customer row and click the wallet icon to open a Credit/Debit adjustment Sheet.

---

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx               # Dashboard
│   │   ├── layout.tsx             # Sidebar + topbar layout
│   │   ├── orders/
│   │   ├── products/
│   │   │   └── _components/       # details-form, variants-manager, images-manager
│   │   ├── categories/
│   │   ├── returns/
│   │   ├── reviews/
│   │   ├── coupons/
│   │   ├── flash-sales/
│   │   ├── users/
│   │   └── analytics/
│   ├── login/
│   └── layout.tsx                 # Root layout (fonts, providers, toaster)
├── components/
│   ├── admin/
│   │   ├── sidebar.tsx            # Fixed sidebar + PageHeader component
│   │   ├── topbar.tsx             # Fixed top bar
│   │   └── form-field.tsx         # Shared FormField, inputCls, inputErrCls
│   ├── providers.tsx              # QueryClientProvider + TooltipProvider
│   └── ui/                        # Shadcn components
├── lib/
│   ├── api.ts                     # Fetch wrapper with auto token refresh
│   ├── auth.ts                    # Login/logout + localStorage user helpers
│   ├── format.ts                  # formatINR, formatDate, formatDateTime, status maps
│   ├── types.ts                   # Order, OrderItem, etc.
│   └── utils.ts                   # cn()
└── proxy.ts                       # Next.js 16 route protection (not middleware.ts)
```
