---
doc_version: 3.0
last_verified: 2026-05-27
scope: full-dashboard-backend-integration-readiness
verification_method: source inspection of dashboard and backend repositories only
canonical: true
---

# Dashboard Release Readiness Report v2

## Final Dashboard Release Decision

Recommended status: **Not ready**.

Backend is mostly ready for the current dashboard/mobile contracts, but dashboard integration is still partial. The dashboard has working foundations for auth, overview, users, subscriptions, packages, payments, orders, operations, promo codes, addons, zones, accounting, and menu management. Release is blocked by dashboard catalog contract gaps, a one-time order fulfillment code mismatch in the dedicated order detail flow, skeletal admin/accounting/dashboard-user screens, and missing visible settings/pickup/restaurant-hours screens.

Repositories inspected:
- Dashboard: `/home/hema/Projects/full app/client_dashbourd-main`
- Backend: `/home/hema/Projects/basicdiet145`

## Dashboard Screens Found

Sidebar screens are defined in `src/constants/NavLinksData.tsx`; role access is in `src/constants/routes.ts`; route files live under `src/routes/_protected`.

Found screens:
- Login: `src/routes/index.tsx`
- Dashboard overview: `src/routes/_protected/dashboard.tsx`
- Payments: `src/routes/_protected/payments/index.tsx`
- Accounting: `src/routes/_protected/accounting/index.tsx`
- Promo codes: `src/routes/_protected/promo-codes/index.tsx`
- Addons: `src/routes/_protected/addons/index.tsx`, plus create/update routes
- Packages/subscription plans: `src/routes/_protected/packages/index.tsx`, plus create/update routes
- Subscriptions: `src/routes/_protected/subscriptions/index.tsx`, details, and create routes
- One-time orders: `src/routes/_protected/one-time-orders/index.tsx`, details route
- Operations board: `src/routes/_protected/operations/index.tsx`, lazy component
- Manual deduction: `src/routes/_protected/manual-deduction/index.tsx`
- Menu/catalog: `src/routes/_protected/menu/index.tsx`, category/product/option-group/option create-update routes
- Delivery: `src/routes/_protected/delivery/index.tsx`
- Delivery zones: `src/routes/_protected/zones/index.tsx`
- App users/customers: `src/routes/_protected/users/index.tsx`, details, create, create-subscription routes
- Dashboard staff users: `src/routes/_protected/dashboard-users/index.tsx`

Not found as routable screens:
- Settings screen: sidebar secondary link is `#`; no route found.
- Restaurant hours screen: hooks/utilities exist, no route found.
- Pickup branch/settings screen: no route found.
- Notifications screen: API utilities exist, no route found.
- Wallet screen: no route found.
- Menu identity/audit screen: API utilities exist, no route found.

## Full Dashboard Screen Integration Matrix

| Dashboard Area | Screen Found? | Dashboard Files / Evidence | Backend API / Contract | Current Status | Risk | Required Action |
|---|---:|---|---|---|---|---|
| Authentication / admin login | Yes | `src/routes/index.tsx`, `src/components/auth/LoginForm.tsx`, `src/lib/authApi.ts`, `src/lib/apis.ts` | `POST /api/dashboard/auth/login`, `GET /api/dashboard/auth/me`, `POST /api/dashboard/auth/logout` in `src/routes/dashboardAuth.js` | Needs manual verification | Medium | Verify token cookie name, response normalization, 401 redirect, and roles in target backend. |
| Dashboard overview / analytics | Yes | `src/routes/_protected/dashboard.tsx`, `src/utils/fetchGetDashboardData.ts`, `src/lib/dashboardStats.ts` | `GET /api/dashboard/overview` in `src/routes/admin.js` | Needs manual verification | Medium | QA response shape for `stats`, `recentSubscriptions`, `recentOrders`; no manual test was run. |
| Users / customers / clients | Yes | `src/routes/_protected/users/index.tsx`, `src/utils/fetchUsersData.ts`, `src/components/pages/users/*` | `GET/POST/PUT /api/dashboard/users`, `GET /api/dashboard/users/:id`, `GET /api/dashboard/users/:id/subscriptions` | Needs manual verification | Medium | QA list/detail/create/update and subscription creation from user route. |
| Dashboard staff users | Yes | `src/routes/_protected/dashboard-users/index.tsx`, `src/utils/fetchDashboardUsers.ts` | `GET/POST/PUT/DELETE /api/dashboard/dashboard-users`, reset password in `src/routes/admin.js` | Partial | Medium | Current page is a read-only/skeletal list; build or verify create/edit/delete/reset-password UI before calling complete. |
| Orders list | Yes | `src/routes/_protected/one-time-orders/index.tsx`, `src/components/pages/one-time-orders/OneTimeOrderList.tsx`, `src/utils/fetchOneTimeOrders.ts` | `GET /api/dashboard/orders` in `src/routes/dashboardOrders.js`; one-time frontend doc | Needs manual verification | Medium | QA list filters, pagination, paid/non-paid handling, and pickup-only defaults. |
| Order details | Yes | `src/routes/_protected/one-time-orders/$orderId.tsx`, `src/components/pages/one-time-orders/OneTimeOrderDetail.tsx` | `GET /api/dashboard/orders/:orderId`, `POST /api/dashboard/orders/:orderId/actions/:action` | Broken | High | Remove pickup-code requirement from one-time order detail fulfillment; backend ops docs say one-time fulfill is visual verification and frontend must not show manual pickup-code input. |
| Payments | Yes | `src/routes/_protected/payments/index.tsx`, `src/utils/fetchPaymentsData.ts`, `src/components/pages/payments/*` | `GET /api/dashboard/payments`, `GET /api/dashboard/payments/:id`, `GET /breakdown`, `POST /verify` | Needs manual verification | Medium | Verify amount units and status values; page computes summary client-side from returned `amount`. |
| Accounting | Yes | `src/routes/_protected/accounting/index.tsx`, `src/utils/fetchDashboardSupportData.ts` | `GET /api/dashboard/accounting/daily-report`, `/export` in `src/routes/dashboardAccounting.js` | Partial | Low | Page displays raw JSON and CSV export only; acceptable as scaffold, not production UX. |
| Subscriptions list | Yes | `src/routes/_protected/subscriptions/index.tsx`, `src/utils/fetchSubscriptionsData.ts`, `src/components/pages/subscriptions/subscriptions-table.tsx` | `GET /api/dashboard/subscriptions/summary`, `GET /api/dashboard/subscriptions` | Needs manual verification | Medium | QA status filters, date fields, balance fields, and pagination against backend response. |
| Subscription details | Yes | `src/routes/_protected/subscriptions/$subscriptionId/index.tsx`, details components, `fetchSubscriptionDetails`, day/balance/entitlement helpers | `GET /api/dashboard/subscriptions/:id`, `/days`, `/audit-log`, `/balances`, `/addon-entitlements`, delivery/update/cancel/extend/freeze routes | Needs manual verification | Medium | Verify detail cards, balances, addon entitlements, day actions, and audit log response shapes. |
| Subscription create | Yes | `src/routes/_protected/subscriptions/create.tsx`, create form sections, `fetchSubscriptionQuote`, `fetchCreateSubscription` | `POST /api/dashboard/subscriptions/quote`, `POST /api/dashboard/subscriptions` | Needs manual verification | High | QA nested plan selection, pickup/delivery defaults, payment method, quote shape, and admin-created subscription side effects. |
| Subscription plans / pricing | Yes | `src/routes/_protected/packages/index.tsx`, create/update routes, `src/types/packageTypes.ts`, `createPackageSchema`, `GramOptionsSection`, `GramCard`, `MealCard` | `GET/POST/PUT /api/dashboard/plans`, nested grams/meals routes in `src/routes/admin.js`; `docs/product-flows/subscription-plan-seeding.md` | Partial | High | UI supports `gramsOptions[].mealsOptions[]`, but must verify it shows only 3 active top-level plans and hides inactive legacy flat plans. |
| Meal planner / builder menu | Not found as dashboard screen | No screen using `builderCatalogV2`; dashboard package/subscription create uses plans/addons/premium meals instead | Public/mobile: `GET /api/subscriptions/meal-planner-menu`; admin legacy: `/api/admin/meal-planner-menu` and `/api/dashboard/meal-planner` | Not found | Medium | If dashboard must manage builder catalog, add screen; otherwise document as mobile-facing only. |
| One-time menu categories | Yes | Menu tab in `src/routes/_protected/menu/index.tsx`, category routes/forms, `fetchMenuCategories`, `menuCategorySchema` | `GET/POST/PATCH/DELETE /api/dashboard/menu/categories`; backend docs require generated keys and `ui.cardVariant` | Partial | High | Remove required manual key on create; add `ui.cardVariant` type, form control, column/payload mapping. |
| One-time menu products | Yes | Product tab/routes/forms, `fetchMenuProducts`, `menuProductSchema`, `MenuProductFormFields` | `GET/POST/PATCH/DELETE /api/dashboard/menu/products`; backend docs require product `ui` fields | Partial | High | Remove required manual key on create; add `ui.cardVariant`, `badge`, `ctaLabel`, `imageRatio` types/forms/payloads. |
| Option groups | Yes | Option-group tab/routes/forms, `fetchMenuOptionGroups`, `menuOptionGroupSchema` | `GET/POST/PATCH/DELETE /api/dashboard/menu/option-groups`; backend docs require `ui.displayStyle` | Partial | High | Remove required manual key on create; add `ui.displayStyle` types/forms/payloads. |
| Options | Yes | Option tab/routes/forms, `fetchMenuOptions`, `menuOptionSchema` | `GET/POST/PATCH/DELETE /api/dashboard/menu/options`, visibility/availability/reorder | Needs manual verification | Medium | CRUD exists; QA response normalization, extra price halala conversion, display/premium metadata fields. |
| Product-option relation rules | Yes | `MenuProductRelationsTab`, `useMenuProductRelations`, `fetchMenuProductGroups` | `PUT /api/dashboard/menu/products/:productId/groups`, relation selection-rule endpoints | Done | Low | Keep relation-level editing; manually QA same reusable group can have different rules per product. |
| Addons | Yes | `src/routes/_protected/addons/*`, `src/utils/fetchAddons*`, `AddonFormFields` | Dashboard currently uses `/api/dashboard/addon-items`; backend also has `/api/dashboard/addons` and `/addon-plans` | Needs manual verification | Medium | Confirm dashboard intentionally manages addon-items, not addon-plans/addons; verify create/update FormData contract. |
| Coupons / promo codes | Yes | `src/routes/_protected/promo-codes/index.tsx`, `fetchPromoCodesData`, promo dialogs/table | `GET/POST/PUT/PATCH/DELETE /api/dashboard/promo-codes`, `/validate` | Needs manual verification | Medium | QA state/status mapper, date limits, usage counts, validate endpoint. |
| Notifications | Not found | `fetchDashboardNotificationsSummary`, `fetchNotificationLogs` exist; no route/sidebar screen | `GET /api/dashboard/notifications/summary`, `GET /api/dashboard/notification-logs` | Not found | Low | Add screen only if operationally required; otherwise keep as support API. |
| Settings | No visible route | `useSettingsQuery`, `fetchSettings`, `settingsTypes` exist; sidebar settings URL is `#` | `GET/PATCH /api/dashboard/settings` | Missing | Medium | Add route if admins must manage settings; otherwise remove/clarify dead sidebar link. |
| Restaurant hours | No visible route | `fetchRestaurantHours`, `fetchUpdateRestaurantHours`, `useRestaurantHoursQuery` exist; no route found | `GET/PUT /api/dashboard/settings/restaurant-hours`, `/api/dashboard/restaurant-hours` | Missing | Medium | Add visible screen for hours/pickup windows or confirm backend-owned/manual ops. |
| Pickup branch/settings | No visible route | One-time detail displays branch; no settings route for pickup locations found | Backend default branch in one-time docs; settings include `pickup_locations` | Missing | Medium | Expose pickup locations/branch if branch ops are admin-managed; verify default `main` in data. |
| Delivery | Yes | `src/routes/_protected/delivery/index.tsx`, `fetchDashboardOpsData` | `GET /api/dashboard/ops/list`, `/search`, `/actions/:action`, `/delivery-schedule` | Needs manual verification | Medium | QA delivery filtering and action payloads; this page uses unified ops list, not only delivery schedule. |
| Delivery zones | Yes | `src/routes/_protected/zones/index.tsx`, `fetchDeliveryZonesData` | `GET/POST/PUT/PATCH/DELETE /api/dashboard/zones` | Needs manual verification | Medium | QA create/edit/toggle/delete and fee fields. |
| Operations board | Yes | `src/routes/_protected/operations/index.lazy.tsx`, `OperationsBoard`, `useOperationsBoard` | `/api/dashboard/kitchen/queue`, `/pickup/queue`, `/courier/queue`, `/api/dashboard/ops/actions/:action` | Needs manual verification | Medium | Good contract direction; verify actions, role visibility, and pickup code behavior for subscription vs one-time rows. |
| Manual deduction | Yes | `src/routes/_protected/manual-deduction/index.tsx`, `ManualDeductionPage`, `fetchDashboardOpsData`, `fetchSubscriptionsData` | `GET /api/dashboard/subscriptions/search`, `POST /api/dashboard/subscriptions/:id/manual-deduction` | Needs manual verification | High | QA balance deduction, reason/audit fields, and cashier/admin role rules. |
| Profile/admin account settings | Not found | No route found | Dashboard auth `/me`; dashboard-users reset password exists | Not found | Low | Add profile/account screen if required before release. |
| Menu identity / shared mapping | No route | `fetchMenuIdentities`, `fetchMenuIdentitySuggestions`; no nav route | `/api/dashboard/menu-identities`, `/menu-identity-suggestions` | Not found | Low | Add admin screen only if shared identity workflow is in release scope. |

## Backend Ready, Dashboard Pending

Only items where backend/docs indicate readiness but dashboard still needs UI or mapper updates:

| Backend-Ready Item | Backend Evidence | Dashboard Gap |
|---|---|---|
| Generated immutable catalog keys | `docs/menu/DASHBOARD_CATALOG_CHANGES.md`; `menuCatalogService.js` throws `IMMUTABLE_KEY` | Category/product/option-group schemas still require `key`; create forms still show manual key input. |
| Category `ui.cardVariant` | `docs/menu/DASHBOARD_CATALOG_CHANGES.md`; `MENU_SELECTION_RULES_FRONTEND_INTEGRATION.md`; backend validation allows `meal_builder`, `light_collection`, `sandwich_collection`, `addon_collection` | No category `ui` type, schema field, form dropdown, table column, or payload mapper. |
| Product UI metadata | Backend docs require `ui.cardVariant`, `ui.badge`, `ui.ctaLabel`, `ui.imageRatio`; backend validates card variants | No product UI metadata in `MenuProduct`, schema, form, or payload mapper. |
| Option group `ui.displayStyle` | Backend docs require `chips`, `radio_cards`, `checkbox_grid`, `dropdown`, `stepper` | No option-group UI metadata in types/schema/form/payload mapper. |
| Relation-level selection rules | `docs/menu/DASHBOARD_CATALOG_CHANGES.md`; backend endpoints for product/group selection rules | Dashboard has `MenuProductRelationsTab`; only manual QA remains. |
| Subscription plan hierarchy | `docs/product-flows/subscription-plan-seeding.md`; `/api/dashboard/plans` supports `gramsOptions[].mealsOptions[]` | Dashboard supports nested editing, but release must verify only 3 active top-level plans display. |
| Default pickup branch `main` | `docs/one-time-orders/ONE_TIME_ORDER_FRONTEND_INTEGRATION.md`; `restaurantHoursService.js` defaults pickup branch to `main` | No pickup branch settings screen; manual QA must verify target data contains/uses `main`. |
| `builderCatalogV2` awareness | `docs/menu/MENU_SELECTION_RULES_FRONTEND_INTEGRATION.md`; `CatalogService.js` returns `builderCatalogV2` | No dashboard screen uses or manages `builderCatalogV2`; likely mobile-facing, but not dashboard-integrated. |
| Updated API types/payload mappers | Backend docs include new catalog fields | `src/types/menuTypes.ts` and `src/utils/menuPayloadMappers.ts` omit the new `ui` payloads. |

## Dashboard Missing Features By Priority

### P0 Release Blockers

- Dashboard still requires manual key input for category/product/option-group creation.
- Dashboard cannot set `category.ui.cardVariant`.
- Dashboard cannot set `product.ui.cardVariant`, `ui.badge`, `ui.ctaLabel`, or `ui.imageRatio`.
- Dashboard cannot set `optionGroup.ui.displayStyle`.
- Dashboard menu API types and payload mappers do not match the current backend catalog UI contract.
- Dedicated one-time order detail fulfillment requires/sends `pickupCode`; backend ops handoff says one-time order fulfillment should not show a manual pickup-code input.
- Subscription plans must be verified to show 3 top-level plans rather than inactive legacy flat plan rows.

### P1 Important Before Production

- Product-option relation rule UX/manual QA for product-specific min/max/isRequired rules.
- Add visible settings/pickup/restaurant-hours screen or explicitly remove those from release scope.
- Better validation messages for backend business errors.
- Clear read-only key display after backend-generated keys exist.
- Manual QA for all create/edit flows: users, subscriptions, packages, menu, addons, promo codes, zones.
- Verify dashboard staff-user CRUD/reset password beyond the current skeletal read view.
- Confirm accounting screen UX expectations; current screen displays raw backend JSON.

### P2 Nice To Have

- Better filters/search across packages, menu entities, payments, and users.
- Better empty/loading/error states.
- Better audit-log surfaces for menu, subscriptions, dashboard users, and payments.
- Mobile card-variant preview inside menu admin.
- Menu identity/suggestion administration if shared identity mapping becomes an ops workflow.

## Backend Endpoint Coverage From Dashboard

| Backend Feature | Endpoint(s) | Dashboard Uses It? | Correct Payload? | Status | Notes |
|---|---|---:|---|---|---|
| Dashboard auth/login | `/api/dashboard/auth/login`, `/me`, `/logout` | Yes | Needs verification | Needs manual verification | `authApi.ts` uses these endpoints and normalizes responses. |
| Dashboard overview | `/api/dashboard/overview` | Yes | N/A | Needs manual verification | `fetchGetDashboardData.ts`; verify `stats`/recent arrays. |
| Dashboard search | `/api/dashboard/search` | Utility only | N/A | Partial | Utility exists; no obvious routed global search UI found. |
| Dashboard notifications | `/api/dashboard/notifications/summary`, `/notification-logs` | Utility only | N/A | Missing | No route found. |
| Accounting | `/api/dashboard/accounting/daily-report`, `/export` | Yes | N/A | Partial | Raw JSON screen plus CSV export. |
| Users/customers | `/api/dashboard/users`, `/users/:id`, `/users/:id/subscriptions` | Yes | Needs verification | Needs manual verification | List/create/update utilities exist. |
| Dashboard staff users | `/api/dashboard/dashboard-users`, reset password | Read list yes; CRUD utilities yes | Needs verification | Partial | Screen is skeletal/read-oriented. |
| Payments | `/api/dashboard/payments`, `/:id`, `/:id/breakdown`, `/:id/verify` | Yes | Needs verification | Needs manual verification | Verify amount/status units. |
| Promo codes | `/api/dashboard/promo-codes`, `/validate`, `/:id/toggle` | Yes | Needs verification | Needs manual verification | Dialog/table exist. |
| Addons | `/api/dashboard/addon-items` | Yes | Needs verification | Needs manual verification | Backend also exposes addon plans/addons; confirm dashboard target entity. |
| Subscription plans | `/api/dashboard/plans`, nested grams/meals endpoints | Yes | Partial | Partial | Nested types/forms exist; must verify active canonical data only. |
| Subscriptions | `/api/dashboard/subscriptions`, `/summary`, `/:id`, quote/create/days/audit/delivery/balances/entitlements/actions | Yes | Needs verification | Needs manual verification | Many utilities exist; broad manual QA required. |
| Manual deduction | `/api/dashboard/subscriptions/search`, `/:id/manual-deduction` | Yes | Needs verification | Needs manual verification | Verify role and audit behavior. |
| One-time orders | `/api/dashboard/orders`, `/:orderId`, `/:orderId/actions/:action` | Yes | Partial | Broken | Detail fulfill path requires pickup code; operations board is closer to backend docs. |
| Operations board | `/api/dashboard/kitchen/queue`, `/pickup/queue`, `/courier/queue`, `/api/dashboard/ops/actions/:action` | Yes | Needs verification | Needs manual verification | Confirm role-based screens and action payloads. |
| Delivery schedule | `/api/dashboard/delivery-schedule` | Utility exists | N/A | Partial | Utility exists; delivery screen primarily uses `/ops/list`. |
| Delivery zones | `/api/dashboard/zones` | Yes | Needs verification | Needs manual verification | Zones screen/table/dialog present. |
| Settings | `/api/dashboard/settings` | Utility only | Needs verification | Missing | No visible route. |
| Restaurant hours | `/api/dashboard/settings/restaurant-hours` | Utility only | Needs verification | Missing | No visible route. |
| Pickup settings | Settings value `pickup_locations`; quote supports `pickup.branchId` | Not found | N/A | Missing | No branch management route found. |
| Menu categories | `/api/dashboard/menu/categories` | Yes | Partial | Partial | Missing generated-key-safe create payload and `ui.cardVariant`. |
| Menu products | `/api/dashboard/menu/products` | Yes | Partial | Partial | Missing generated-key-safe create payload and product `ui` metadata. |
| Menu option groups | `/api/dashboard/menu/option-groups` | Yes | Partial | Partial | Missing generated-key-safe create payload and `ui.displayStyle`. |
| Menu options | `/api/dashboard/menu/options` | Yes | Needs verification | Needs manual verification | CRUD utilities/forms exist. |
| Product-option relations | `/api/dashboard/menu/products/:productId/groups`, relation rules/options endpoints | Yes | Correct by inspection | Done | `MenuProductRelationsTab` edits min/max/isRequired/sort/order option overrides. |
| Menu publish/audit/versions | `/api/dashboard/menu/validate`, `/publish`, `/audit-logs`, `/versions`, `/rollback/:versionId` | Yes | Needs verification | Needs manual verification | Tabs/dialogs exist. |
| Menu identity mapping | `/api/dashboard/menu-identities`, `/menu-identity-suggestions` | Utility only | N/A | Not found | No visible screen found. |
| Public one-time menu | `GET /api/orders/menu?lang=ar` | Not a dashboard screen | N/A | Needs manual verification | Use for catalog QA after dashboard edits. |
| Public one-time quote | `POST /api/orders/quote` | Not in dashboard | N/A | Needs manual verification | Use for pickup default QA. |
| Subscription meal planner menu | `GET /api/subscriptions/meal-planner-menu?includeLegacy=true&lang=ar` | Not found | N/A | Not found | No dashboard `builderCatalogV2` usage found. |

## Menu / Catalog Readiness Details

Backend requirements from `docs/menu/DASHBOARD_CATALOG_CHANGES.md` and `docs/menu/MENU_SELECTION_RULES_FRONTEND_INTEGRATION.md`:

- Keys are backend-generated.
- Keys are immutable.
- Dashboard should not require manual key input.
- Category `ui.cardVariant` dropdown values: `meal_builder`, `light_collection`, `sandwich_collection`, `addon_collection`.
- Product `ui.cardVariant` dropdown values: `standard`, `premium`, `large_salad`, `addon`.
- Product UI fields required: `badge`, `ctaLabel`, `imageRatio`.
- Option group `ui.displayStyle` dropdown values: `chips`, `radio_cards`, `checkbox_grid`, `dropdown`, `stepper`.
- Product-specific selection rules must be edited on relation level, not global option-group only.

Dashboard evidence:
- `src/lib/validations/menuCategorySchema.ts`, `menuProductSchema.ts`, and `menuOptionGroupSchema.ts` still require `key`.
- `MenuCategoryFormFields`, `MenuProductFormFields`, and `MenuOptionGroupFormFields` show manual key inputs, disabled only on edit.
- `src/types/menuTypes.ts` has no `ui` field on `MenuCategory`, `MenuProduct`, or `MenuOptionGroup`.
- `src/utils/menuPayloadMappers.ts` does not send category/product/option-group `ui` metadata.
- `MenuProductRelationsTab` edits relation-level `minSelections`, `maxSelections`, `isRequired`, `sortOrder`, and option overrides, which matches the backend relation-rule model.

## Data and Seed Readiness

Do not run seed scripts from this report task. For release/staging verification, the following commands are relevant:

```bash
cd /home/hema/Projects/basicdiet145
npm run ensure:pickup-main
npm run seed:subscription-plans
node scripts/seed-catalog.js --only-subscription-plans
```

Readiness notes:
- Pickup main must exist or fallback must be verified. Backend docs define default pickup branch `main`; `restaurantHoursService.js` also defaults pickup mode to `main` when branch data is missing.
- Subscription plans should be 3 top-level plans with 27 nested price points: 3 durations x 3 grams x 3 meal counts.
- Old flat plans such as `subscription_1_meal_7_days_100g` should be inactive.
- Dashboard must not display inactive legacy flat plans as active subscription packages.
- Menu seed/catalog data must include UI metadata so `GET /api/orders/menu?lang=ar` returns category/product/group `ui` values.

## Manual QA Checklist

### Authentication
- Log in with admin, superadmin, cashier, kitchen, and courier dashboard users.
- Confirm role default route and denied-route behavior match `src/constants/routes.ts`.
- Confirm logout clears session and 401 redirects to `/`.

### Dashboard Overview
- Load `/dashboard`.
- Confirm cards match backend `stats`.
- Confirm recent subscriptions and recent orders render without null-field crashes.

### Categories
- Create without manually entering key after dashboard fix.
- Edit name without changing key.
- Set category `cardVariant`.
- Confirm `GET /api/orders/menu?lang=ar` returns selected `category.ui.cardVariant`.

### Products
- Create/edit product.
- Set product `cardVariant`.
- Set `badge`, `ctaLabel`, and `imageRatio`.
- Confirm `GET /api/orders/menu?lang=ar` returns updated `product.ui`.

### Option Groups
- Create/edit option group without manual key after dashboard fix.
- Set `displayStyle`.
- Confirm `GET /api/orders/menu?lang=ar` returns `product.optionGroups[].ui.displayStyle`.

### Options
- Create/edit option and verify extra price is stored as halala.
- Toggle visibility/availability.
- Confirm option appears under the intended group/product relation.

### Product Relations
- Link group to product.
- Set `minSelections`, `maxSelections`, and `isRequired`.
- Link allowed options.
- Confirm rules are product-specific, not global group-only.

### Subscription Plans
- Confirm 3 top-level active plans only.
- Confirm 100g/150g/200g inside each plan.
- Confirm 1/2/3 meal prices inside each grams option.
- Confirm prices are stored as halala and displayed as SAR.
- Confirm inactive legacy flat plans are hidden from normal active package management.

### Subscriptions
- Create quote from dashboard.
- Create subscription with pickup and delivery variants if both are supported.
- View detail, days, balances, addon entitlements, and audit log.
- Freeze/unfreeze, cancel, extend, skip/unskip a day in a test environment.

### Orders
- View order list.
- View order details.
- Confirm status/payment fields match backend.
- Confirm no frontend crashes on new quote/order response shapes.
- Fulfill a one-time pickup order without entering a manual pickup code after the detail-flow fix.

### Operations
- View kitchen, pickup, and courier tabs by role.
- Prepare and mark ready-for-pickup.
- Confirm one-time orders show pickup code for visual comparison only.
- Confirm subscription pickup still requires code where backend expects verification.

### Payments
- List payments.
- Open details/breakdown if exposed in UI.
- Verify payment status.
- Confirm SAR/halala/amount unit display is correct.

### Promo Codes
- Create/update/toggle/delete a promo code.
- Validate a promo code.
- Confirm date and usage limits display correctly.

### Addons
- Create/update/toggle/delete addon item.
- Confirm dashboard entity (`addon-items`) is the intended release scope.
- Confirm image upload and linked menu product fields.

### Settings / Pickup
- Confirm main branch exists.
- Confirm quote with `branchId: "main"`.
- Confirm missing `branchId` does not return `INVALID_BRANCH`.
- Confirm missing `pickupWindow` behaves as ASAP according to backend docs.
- Add a visible settings screen if admins must manage pickup branches or restaurant hours.

### Restaurant Hours
- Confirm `GET /api/dashboard/settings/restaurant-hours`.
- Update hours and pickup windows in a test environment.
- Confirm `GET /api/orders/menu?lang=ar` reflects open/closed behavior.

### Zones / Delivery
- Create/edit/toggle/delete zones.
- Confirm delivery board filters and actions.
- Confirm delivery schedule if in release scope.

### Dashboard Staff Users
- List staff users.
- Create/edit/delete staff user.
- Reset password.
- Verify self-demotion/self-deactivation protections from backend.

## Useful Commands

Dashboard:

```bash
cd "/home/hema/Projects/full app/client_dashbourd-main"
rg "cardVariant|displayStyle|gramsOptions|mealsOptions|builderCatalogV2" .
rg "axios|fetch|apiClient|endpoint" .
rg "routes|sidebar|navigation" .
```

Backend:

```bash
cd /home/hema/Projects/basicdiet145
npm run ensure:pickup-main
npm run seed:subscription-plans
node scripts/seed-catalog.js --only-subscription-plans
```

API checks:

```http
GET /api/orders/menu?lang=ar
GET /api/subscriptions/meal-planner-menu?includeLegacy=true&lang=ar
POST /api/orders/quote
```

## Assumptions and Unknowns

- This report is source-inspection only. No backend server, frontend server, tests, seeds, or API requests were run except `git diff --check` after editing.
- "Done" means source code clearly matches the contract by inspection; it does not mean manually tested.
- Several utilities exist without visible routed screens, especially settings, restaurant hours, notifications, health, logs, subscription terms, and menu identity mapping.
- Some backend docs distinguish mobile/public contracts from dashboard contracts. `builderCatalogV2` appears mobile-facing; no dashboard usage was found.
- Exact production data state is unknown until seed/readiness commands and API checks are run in the target environment.

## Final Dashboard Release Decision

Recommended status remains: **Not ready for final release yet**.

Backend is mostly ready, but dashboard contract updates are still partial. The immediate release blockers are catalog generated-key/UI metadata support, one-time order detail fulfillment pickup-code behavior, subscription plan active-data verification, and a decision on whether settings/restaurant-hours/pickup branch administration must be visible before release.
