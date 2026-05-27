# Missing Dashboard Screens — Implementation

> **Status:** Implemented ✅ — Needs QA before release

Five previously missing dashboard screens have been wired into navigation, role routing, hooks, utilities, and the TanStack route tree.

---

## Screens Implemented

| # | Screen | Route | Roles | Status |
|---|--------|-------|-------|--------|
| 1 | Settings | `/settings` | admin, superadmin | ⚠️ Needs QA |
| 2 | Restaurant Hours | `/restaurant-hours` | admin, superadmin | ⚠️ Needs QA |
| 3 | Pickup Branches | `/pickup-branches` | admin, superadmin | 🔵 Read-only |
| 4 | Notifications | `/notifications` | admin, superadmin | ⚠️ Needs QA |
| 5 | Profile | `/profile` | all roles (view) / admin+ (password) | ⚠️ Needs QA |

---

## 1. Settings

**Endpoints**
```
GET   /api/dashboard/settings
PATCH /api/dashboard/settings
```

**Response shape**
```ts
{
  status: string;
  data: {
    restaurant_is_open: boolean;
    delivery_windows: object;
    pickup_locations: object;   // read-only — PATCH rejects this field
    prices: object;
    VAT: number;
    cutoff: string;
    hours: object;
  }
}
```

**Files created**
- `src/types/settingsTypes.ts`
- `src/utils/fetchSettings.ts`
- `src/hooks/useSettingsQuery.ts`
- `src/routes/_protected/settings/index.tsx`

**Files modified**
- `src/constants/NavLinksData.tsx` — replaced `#` href with `/settings`
- `src/constants/routes.ts` — registered route with admin/superadmin roles
- `src/constants/routeTranslations.ts`

**Backend gap**
> `PATCH /settings` rejects `pickup_locations` — pickup branches cannot be edited from this screen.

**QA checklist**
- [ ] Page loads and displays current values
- [ ] Edit a value and save — verify PATCH response
- [ ] Confirm `restaurant_is_open` toggle reflects immediately

---

## 2. Restaurant Hours

**Endpoints**
```
GET /api/dashboard/settings/restaurant-hours
PUT /api/dashboard/settings/restaurant-hours
```

**Response shape**
```ts
{
  timezone: string;
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  restaurant_hours: object;
  delivery_windows: object;
  cutoff_time: string;
  temporary_closure: object;
  isOpenNow: boolean;
}
```

**Files created**
- `src/types/restaurantHoursTypes.ts`
- `src/utils/fetchRestaurantHours.ts`
- `src/hooks/useRestaurantHoursQuery.ts`
- `src/routes/_protected/restaurant-hours/index.tsx`

**Files modified**
- `src/constants/NavLinksData.tsx`
- `src/constants/routes.ts`
- `src/constants/routeTranslations.ts`

**Backend gap**
> Endpoint returns `delivery_windows` but does not return pickup windows as a separate field.

**QA checklist**
- [ ] Weekly schedule renders with correct open/close times per day
- [ ] Edit a day and save — verify PUT response
- [ ] Confirm `temporary_closure` affects `GET /api/orders/menu?lang=ar`

---

## 3. Pickup Branches *(read-only)*

**Endpoints**
```
GET /api/dashboard/settings   ← pickup_locations is nested inside this response
```

No dedicated endpoint exists. Default branch logic uses `branchId = "main"`.

**Files created**
- `src/types/pickupTypes.ts`
- `src/utils/fetchPickupBranches.ts`
- `src/routes/_protected/pickup-branches/index.tsx`

**Files modified**
- `src/constants/NavLinksData.tsx`
- `src/constants/routes.ts`

**Backend gaps**
> - No dedicated endpoint for managing pickup branches.
> - `PATCH /settings` rejects `pickup_locations` — screen is intentionally read-only.
> - Adding/editing branches requires a new backend endpoint.

**QA checklist**
- [ ] `main` branch is visible
- [ ] Quote with `branchId: "main"` works without `INVALID_BRANCH` error
- [ ] No edit button shown (read-only by design)

---

## 4. Notifications

**Endpoints**
```
GET /api/dashboard/notifications/summary
GET /api/dashboard/notification-logs
```

**Response shape**
```ts
// summary
{ counts: object; recent: Notification[]; recentActivity: Activity[] }

// logs
{ status: string; data: NotificationLog[]; meta: { page: number; limit: number; total: number } }
```

**Files created**
- `src/types/notificationTypes.ts`
- `src/utils/fetchNotifications.ts`
- `src/routes/_protected/notifications/index.tsx`

**Files modified**
- `src/constants/NavLinksData.tsx`
- `src/constants/routes.ts`
- `src/constants/routeTranslations.ts`

**QA checklist**
- [ ] Summary count cards render correctly
- [ ] Logs table renders with pagination
- [ ] Filters work if implemented

---

## 5. Profile

**Endpoints**
```
GET  /api/dashboard/auth/me
POST /api/dashboard/dashboard-users/:id/reset-password
```

**Response shape**
```ts
// GET /me
{ status: string; data: { user: DashboardUser }; user: DashboardUser }
```

**Files created**
- `src/routes/_protected/profile/index.tsx`

**Files modified**
- `src/components/layout/nav-user.tsx` — added profile link in top avatar menu
- `src/constants/routes.ts`

**Backend gaps**
> - No self-service password change endpoint.
> - Reuses `admin reset-password` endpoint — limited to admin/superadmin only.

**QA checklist**
- [ ] `/me` data renders correctly
- [ ] Password change works with admin role
- [ ] Non-admin roles do not see the password change button

---

## Remaining Release Blockers

These are **not** part of this implementation. They still block release:

### P0 — Must fix before release

| # | Issue |
|---|-------|
| 1 | Remove manual `pickupCode` input from one-time order detail fulfillment |
| 2 | Remove manual `key` field from category/product/option-group create forms |
| 3 | Add `ui.cardVariant` to category form + payload mapper |
| 4 | Add `ui.cardVariant`, `badge`, `ctaLabel`, `imageRatio` to product form + payload mapper |
| 5 | Add `ui.displayStyle` to option group form + payload mapper |
| 6 | Verify only 3 active subscription plans display (hide legacy flat plans) |

### P1 — Important before production

| # | Issue |
|---|-------|
| 1 | Build full CRUD for dashboard staff users (create/edit/delete/reset-password) |
| 2 | Replace raw JSON display in accounting screen with proper UI |
| 3 | Manual QA for all flows: subscriptions, orders, packages, zones |

---

## Verification Notes

- `git diff --check` could not run — directory is not a git repository.
- `npm run typecheck` could not run — `node_modules` not installed in this workspace.
- Run `npm install && npm run typecheck` locally before merging.
