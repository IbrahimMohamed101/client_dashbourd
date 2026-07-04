# Dashboard Role Permissions

This document is the dashboard role-permission baseline for the frontend dashboard and backend dashboard API families.

## Roles

Canonical dashboard roles:

- `superadmin`
- `admin`
- `kitchen`
- `courier`
- `cashier`

Unknown roles fail closed. Logged-out users are redirected to login. Direct navigation to a disallowed route redirects to that role's default route.

## Frontend Route Matrix

| Role | Default Route | Allowed Protected Routes |
|---|---|---|
| `superadmin` | `/dashboard` | `/dashboard`, `/one-time-orders`, `/operations`, `/subscriptions`, `/packages`, `/users`, `/addons`, `/delivery`, `/payments`, `/accounting`, `/promo-codes`, `/zones`, `/manual-deduction`, `/menu`, `/premium-meals`, `/dashboard-users`, `/settings`, `/restaurant-hours`, `/pickup-branches`, `/notifications`, `/profile` |
| `admin` | `/dashboard` | `/dashboard`, `/one-time-orders`, `/operations`, `/subscriptions`, `/packages`, `/users`, `/addons`, `/delivery`, `/payments`, `/accounting`, `/promo-codes`, `/zones`, `/manual-deduction`, `/menu`, `/premium-meals`, `/dashboard-users`, `/settings`, `/restaurant-hours`, `/pickup-branches`, `/notifications`, `/profile` |
| `kitchen` | `/operations` | `/operations`, `/one-time-orders`, `/profile` |
| `courier` | `/delivery` | `/delivery`, `/profile` |
| `cashier` | `/dashboard` | `/dashboard`, `/one-time-orders`, `/subscriptions`, `/payments`, `/users`, `/profile` |

Nested routes inherit access from their parent route. For example, `/subscriptions/create` is allowed when `/subscriptions` is allowed.

## Sidebar Navigation

The sidebar is filtered from the same route matrix used by the route guard. A role should not see a sidebar link that it cannot open directly.

- `admin` and `superadmin`: main dashboard navigation plus settings, restaurant hours, pickup branches, notifications, and dashboard users.
- `kitchen`: one-time orders and operations.
- `courier`: delivery only.
- `cashier`: dashboard, one-time orders, subscriptions, payments, and users.

`/profile` is available through user/account UI, not the main sidebar.

## Backend API Matrix

All protected dashboard API families must require dashboard authentication. `superadmin` is allowed by middleware bypass wherever a dashboard role guard is used. User role and active status are read from the database on authenticated requests; inactive dashboard users are blocked.

| API Family | Allowed Dashboard Roles | Notes |
|---|---|---|
| `/api/courier/*` | `superadmin`, `admin`, `courier` | Canonical courier delivery/order action surface. `/delivery` must continue using this family. |
| `/api/dashboard/ops/list`, `/api/dashboard/ops/search`, `/api/dashboard/ops/actions/*`, `/api/dashboard/ops/subscription-days/*` | `superadmin`, `admin`, `kitchen` | Unified operations surface. Courier role must not use these endpoints directly. |
| `/api/dashboard/ops/cashier/*` | `superadmin`, `admin`, `cashier` | Cashier operational lookup/consumption helpers. |
| `/api/dashboard/orders/*` | `superadmin`, `admin`, `kitchen`, `cashier` | One-time order dashboard list/detail/actions. Courier uses `/api/courier/orders/*` instead. |
| `/api/dashboard/kitchen/*`, `/api/dashboard/pickup/*` | `superadmin`, `admin`, `kitchen` | Kitchen and pickup operations lanes. |
| `/api/dashboard/courier/*`, `/api/dashboard/delivery-schedule` | `superadmin`, `admin` | Admin operations delivery lane only; courier dashboard role uses `/api/courier/*`. |
| `/api/dashboard/subscriptions/search`, `/api/dashboard/subscriptions/*/balances`, `/api/dashboard/subscriptions/*/manual-deduction`, `/api/dashboard/subscriptions/*/manual-deductions` | `superadmin`, `admin`, `cashier` | Cashier-safe subscription search, balances, and manual deduction surfaces. |
| `/api/dashboard/subscriptions/*/audit`, subscription lifecycle admin actions | `superadmin`, `admin` | Admin-only subscription management. |
| `/api/dashboard/overview`, `/api/dashboard/search`, `/api/dashboard/users`, `/api/dashboard/orders`, `/api/dashboard/payments`, subscription read/create/quote routes in `admin.js` | `superadmin`, `admin`, `cashier` | Cashier dashboard, customer, order, subscription, and payment read/workflow routes. |
| `/api/dashboard/accounting/*` | `superadmin`, `admin` | Accounting screen is not cashier-accessible unless explicitly approved later. |
| `/api/dashboard/menu*`, `/api/dashboard/meal-builder*`, `/api/dashboard/catalog-items*`, `/api/dashboard/premium-upgrades*`, `/api/dashboard/settings*`, `/api/dashboard/restaurant-hours*`, `/api/dashboard/zones*`, `/api/dashboard/promo-codes*`, `/api/dashboard/dashboard-users*`, `/api/dashboard/notifications*`, `/api/dashboard/logs*` | `superadmin`, `admin` | Admin configuration and management APIs. Dashboard user management remains admin/superadmin unless product later decides superadmin-only. |

## Response Rules

- Missing or invalid dashboard auth: `401`.
- Valid auth with inactive dashboard user: blocked by dashboard auth middleware.
- Valid auth with a disallowed dashboard role: `403`.
- `superadmin` bypasses dashboard role guards.

## Invariants

- Do not change endpoint semantics as part of role alignment.
- Do not migrate `/delivery` away from `/api/courier/*`.
- Do not synthesize courier action buttons from frontend `can*` booleans.
- Do not add `/api` to `VITE_BACKEND_URL`; frontend API paths already include `/api/...`.
- Frontend route guard and sidebar filtering must use the same matrix.
