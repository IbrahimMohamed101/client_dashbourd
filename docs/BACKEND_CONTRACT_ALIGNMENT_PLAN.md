# Backend Contract Alignment Plan

Inspection date: 2026-06-18  
Dashboard repo: `client_dashbourd`  
Backend repo: `basicdiet145`  
Contract source: `basicdiet145/docs/dashboard-contracts`

This document is an inspection and implementation plan only. It does not change frontend behavior, backend behavior, API contracts, or Flutter/mobile code.

## Executive Summary

The dashboard is a Vite + React + TanStack Router/Query app with shadcn UI components, route-level protected layout, Axios API client, and a set of page-specific hooks under `src/hooks` and API helpers under `src/utils`.

I found 39 route entries in the generated/router tree, including `/` login and `/_protected` shell. Excluding those wrappers, there are 37 dashboard routes/screens/actions to align.03333333

Primary classification:

| Classification | Count | Meaning |
| --- | ---: | --- |
| Contract-aligned or mostly aligned | 15 | Frontend calls the contract endpoint family and mainly needs field/UI polish or validation. |
| Needs frontend work | 19 | Frontend uses old endpoints, incomplete read models, derived fields, or missing screen behavior. |
| Needs backend clarification or test caveat | 7 | Contract is `NEEDS_TESTS`, has a route-map mismatch, or frontend calls endpoints not documented in the contract pack. |

The best first implementation target is `/dashboard` Dashboard Home. It has a `READY` backend contract, a single endpoint (`GET /api/dashboard/overview`), and is the safest place to establish the dashboard-wide rule: render backend read models directly and do not calculate business balances in the frontend.

## Authoritative Sources

Backend contracts inspected:

- `00_OVERVIEW.md`
- `01_DASHBOARD_HOME.md`
- `02_PAYMENTS.md`
- `03_ACCOUNTING.md`
- `04_PROMO_CODES.md`
- `05_ADDONS.md`
- `06_PACKAGES.md`
- `07_SUBSCRIPTIONS.md`
- `08_ONE_TIME_ORDERS.md`
- `09_OPERATIONS.md`
- `10_MANUAL_DEDUCTION.md`
- `11_MENU_CATALOG.md`
- `11A_MENU_CATEGORIES.md`
- `11B_MENU_PRODUCTS.md`
- `11C_MENU_PRODUCT_CUSTOMIZATION.md`
- `11D_MENU_OPTION_GROUPS.md`
- `11E_MENU_OPTIONS.md`
- `11F_MENU_PREVIEW_RELEASE.md`
- `12_DELIVERY.md`
- `13_DELIVERY_ZONES.md`
- `14_APP_USERS.md`
- `15_DASHBOARD_USERS.md`
- `16_SETTINGS.md`
- `17_RESTAURANT_HOURS.md`
- `18_PICKUP_BRANCHES.md`
- `19_NOTIFICATIONS.md`
- `20_PROFILE.md`
- `HANDOFF_SUMMARY.md`
- `README.md`
- `DASAHBOARD_SCREEN_AND_ROUTES_MAP.md` as context only, not source of truth.

Important source-of-truth rule from the contract pack: when the route map disagrees with backend contract files, the contract files win.

## Non-Negotiable Business Rules

These rules must be preserved during frontend alignment:

- The dashboard must not calculate subscription balances.
- The dashboard must not treat add-ons as meal slots.
- The dashboard must not treat premium upgrades as extra meals.
- `selectedMealSlotIds` must never contain add-ons.
- `selectedPickupItemIds` is the unified pickup field.
- Fulfillment consumes only `selectedPickupItemIds`.
- Picked add-ons must not reappear.
- Unpicked planned add-ons remain planned and available.
- The dashboard must consume backend read models only.
- Flutter/mobile code must remain untouched.

## Current Frontend Architecture

| Area | Current implementation |
| --- | --- |
| Routing | TanStack Router file routes under `src/routes`, generated in `src/routeTree.gen.ts`. |
| Protected shell | `src/routes/_protected/route.tsx` loads session, applies `authMiddleware`, and renders sidebar/header layout. |
| API client | `src/lib/apis.ts` Axios instance with `VITE_BACKEND_URL`, JSON headers, Arabic language header, `dashboardToken` auth header, 401 redirect, and 403 toast. |
| Auth | `src/lib/authApi.ts` calls `/api/dashboard/auth/login`, `/api/dashboard/auth/me`, and `/api/dashboard/auth/logout`. |
| Server state | TanStack Query query/mutation hooks under `src/hooks`; API utilities under `src/utils`. |
| Forms | React Hook Form + Zod validation under `src/lib/validations` and feature-specific form components. |
| Tables | shadcn table primitives plus TanStack Table wrappers/components. |
| Permissions | `src/constants/routes.ts` and `src/lib/authMiddleware.ts` filter route access by dashboard role. |

## Screen-by-Screen Alignment Matrix

Status labels in this table are frontend alignment statuses, not backend contract statuses.

| Dashboard route | Contract file | Backend status | Frontend API/hook state | Alignment status | Required work |
| --- | --- | --- | --- | --- | --- |
| `/dashboard` | `01_DASHBOARD_HOME.md` | `READY` | Uses `dashboardQueryOptions` and `/api/dashboard/overview`. | Mostly aligned | Make cards/charts/tables render only fields from overview. Remove any frontend-derived business totals. |
| `/payments` | `02_PAYMENTS.md` | `READY` | Uses `/api/dashboard/payments`, detail, verify, plus `/breakdown`. | Needs clarification | Keep list/detail/verify. Confirm whether `/payments/:id/breakdown` is a supported dashboard contract endpoint. |
| `/accounting` | `03_ACCOUNTING.md` | `READY` | Uses daily report and export endpoints. | Aligned | Polish table/export states; no business recalculation. |
| `/promo-codes` | `04_PROMO_CODES.md` | `READY` | Uses promo code list/detail/create/update/delete/toggle/validate. | Mostly aligned | Verify payload/response fields against contract; keep server validation messages. |
| `/addons` | `05_ADDONS.md` | Overview says `READY_WITH_LIMITATIONS`; file/handoff say `READY` | Frontend main CRUD uses `/api/dashboard/addon-items`. Contract centers `/api/dashboard/addons` plus addon plans/items. | Needs frontend work | Move list/detail/create/update/toggle to the contract endpoint family. Preserve distinction between add-ons and meal slots. |
| `/addons/create` | `05_ADDONS.md` | Same as above | Uses addon item create utility. | Needs frontend work | Rebuild payload around contract add-on model, not legacy `addon-items` assumptions. |
| `/addons/$addonId/update` | `05_ADDONS.md` | Same as above | Uses `/api/dashboard/addon-items/:id`. | Needs frontend work | Use contract detail endpoint and field names. |
| `/packages` | `06_PACKAGES.md` | Overview says `READY_WITH_LIMITATIONS`; file/handoff say `READY` | Uses `/api/dashboard/plans`. | Mostly aligned | Verify table cards map to backend plan fields exactly. |
| `/packages/create` | `06_PACKAGES.md` | Same as above | Uses `POST /api/dashboard/plans`. | Mostly aligned | Validate create payload against contract and backend validation errors. |
| `/packages/$planId/update` | `06_PACKAGES.md` | Same as above | Uses `GET/PUT /api/dashboard/plans/:id` and toggle. | Mostly aligned | Confirm update/toggle response invalidation and field labels. |
| `/subscriptions` | `07_SUBSCRIPTIONS.md` | `READY` | Uses summary/list/detail/quote and multiple lifecycle utilities. | Needs frontend work | Align detail, audit, lifecycle, balance/add-on fields to contract read models. Do not calculate balances. |
| `/subscriptions/create` | `07_SUBSCRIPTIONS.md` | `READY` | Uses quote/create and user/package helpers. | Needs frontend work | Use backend quote as pricing source; avoid duplicating VAT/meal/add-on calculations. |
| `/subscriptions/$subscriptionId` | `07_SUBSCRIPTIONS.md` | `READY` | Uses detail, unfreeze, audit-log, days, balances, add-on entitlements. | Needs frontend work | Replace `/audit-log` if contract expects `/audit`; align lifecycle and entitlement displays. |
| `/users/$userId/create-subscription` | `07_SUBSCRIPTIONS.md` + `14_APP_USERS.md` | `READY` + `READY_WITH_LIMITATIONS` | User-scoped subscription create flow. | Needs frontend work | Ensure this uses the same contract-aligned subscription create/quote flow. |
| `/one-time-orders` | `08_ONE_TIME_ORDERS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/orders` and actions; also old queue helpers exist elsewhere. | Mostly aligned with caveat | Keep order list/detail contract; backend test coverage is limited. |
| `/one-time-orders/$orderId` | `08_ONE_TIME_ORDERS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/orders/:orderId` and action endpoints. | Mostly aligned with caveat | Ensure payment/pricing fields are backend-rendered; no local VAT math. |
| `/operations` | `09_OPERATIONS.md` | Overview says `READY_WITH_LIMITATIONS`; file/handoff say `READY` | Page uses `useOperationsBoard`, which still calls `/kitchen/queue`, `/pickup/queue`, `/courier/queue`; separate utilities exist for `/ops/list` and `/ops/search`. | Needs frontend work | Consolidate board onto `GET /api/dashboard/ops/list`, `GET /api/dashboard/ops/search`, and backend-provided action endpoints/read models. |
| `/manual-deduction` | `10_MANUAL_DEDUCTION.md` | `READY` | Page uses `/api/dashboard/subscriptions/search` and `/subscriptions/:id/manual-deduction`. Contract expects `/api/dashboard/ops/cashier/customer-lookup` and `/customer-consumption`. | Needs frontend work | Replace search/deduct flow with cashier lookup and consumption contract. Do not map or recalculate remaining balances locally. |
| `/menu` | `11_MENU_CATALOG.md` through `11F_MENU_PREVIEW_RELEASE.md` | `READY_WITH_LIMITATIONS` | Tabbed workflow; uses catalog, builder, preview, validation, publish, versions, audit. | Needs frontend work | Split contract alignment by menu subdomain. Remove/flag tabs that call endpoints outside the contract pack unless backend confirms them. |
| `/menu/categories/create` | `11A_MENU_CATEGORIES.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/menu/categories`. | Mostly aligned with caveat | Confirm upload/image payload and category-product assignment endpoints. |
| `/menu/categories/$categoryId/update` | `11A_MENU_CATEGORIES.md` | `READY_WITH_LIMITATIONS` | Uses category detail/update and product assignment helpers. | Mostly aligned with caveat | Verify assignment/move APIs are in contract scope. |
| `/menu/products/create` | `11B_MENU_PRODUCTS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/menu/products`. | Mostly aligned with caveat | Keep product payload contract-driven. |
| `/menu/products/$productId/update` | `11B` + `11C` | `READY_WITH_LIMITATIONS` | Uses product composer and customization panel. | Needs frontend work | Use `/products/:productId/option-groups` contract endpoints consistently; old `/products/:id/groups` utility should be removed or retired. |
| `/menu/option-groups/create` | `11D_MENU_OPTION_GROUPS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/menu/option-groups` and assignment helper. | Mostly aligned with caveat | Confirm assign options endpoint method/payload. |
| `/menu/option-groups/$groupId/update` | `11D_MENU_OPTION_GROUPS.md` | `READY_WITH_LIMITATIONS` | Uses group detail/update and option assignment. | Mostly aligned with caveat | Confirm option assignment endpoint with backend contract. |
| `/menu/options/create` | `11E_MENU_OPTIONS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/menu/options`. | Mostly aligned with caveat | Validate extra price, visibility, availability fields. |
| `/menu/options/$optionId/update` | `11E_MENU_OPTIONS.md` | `READY_WITH_LIMITATIONS` | Uses option detail/update. | Mostly aligned with caveat | Same field validation as create. |
| `/delivery` | `12_DELIVERY.md` | `NEEDS_TESTS` | Uses dashboard ops list/search and filters courier items; old `/api/dashboard/courier/queue` utilities also exist. Contract says `/api/courier/deliveries/today`. | Needs frontend work + backend test caveat | Decide whether screen is courier contract or ops read-model contract; do not call `/api/dashboard/courier/*` unless backend contract is updated. |
| `/zones` | `13_DELIVERY_ZONES.md` | Overview says `READY_WITH_LIMITATIONS`; handoff says `READY` | Uses `/api/dashboard/zones` CRUD/toggle. | Mostly aligned | Verify pagination/toggle response and table fields. |
| `/users` | `14_APP_USERS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/users` list/detail/create/update. | Mostly aligned with caveat | Field-level contract assertions are limited; verify list/detail field names. |
| `/users/create` | `14_APP_USERS.md` | `READY_WITH_LIMITATIONS` | Uses `POST /api/dashboard/users`. | Mostly aligned with caveat | Validate create fields and error states. |
| `/users/$userId` | `14_APP_USERS.md` | `READY_WITH_LIMITATIONS` | Uses `/api/dashboard/users/:userId`. | Mostly aligned with caveat | Avoid deriving subscription/business balances from nested user data. |
| `/dashboard-users` | `15_DASHBOARD_USERS.md` | Overview says `READY_WITH_LIMITATIONS`; handoff says `READY` | Uses `/api/dashboard/dashboard-users` CRUD/reset password. | Mostly aligned | Verify role fields and reset password permission flow. |
| `/settings` | `16_SETTINGS.md` | `READY` | Uses `GET/PATCH /api/dashboard/settings`. | Aligned | Keep settings form contract-driven; avoid local money/VAT semantics beyond display. |
| `/restaurant-hours` | `17_RESTAURANT_HOURS.md` | `READY` | Uses `/api/dashboard/settings/restaurant-hours`. | Aligned | Confirm method: frontend uses `PUT`; contract should be checked before implementation. |
| `/pickup-branches` | `18_PICKUP_BRANCHES.md` | `READY` | Uses settings query and patch through `/api/dashboard/settings`. | Mostly aligned | Ensure branch model matches settings contract; avoid local branch availability rules. |
| `/notifications` | `19_NOTIFICATIONS.md` | `NEEDS_TESTS` | Uses `/notifications/summary` and `/notification-logs`. | Endpoint aligned, backend test caveat | Implement UI only after accepting test coverage risk or adding backend tests. |
| `/profile` | `20_PROFILE.md` | `NEEDS_TESTS` | Displays `useAuth` user and calls dashboard staff password reset for admins. Contract expects `/auth/me` and `/auth/logout`. | Needs frontend work + backend test caveat | Align profile behavior to current-user contract, not dashboard-user admin reset flow unless the backend contract is expanded. |

## High-Risk Drift Found

1. Add-ons still use `addon-items` as the primary CRUD path.
   - Current files: `src/utils/fetchAddons.ts`, `fetchAddonById.ts`, `fetchCreateAddon.ts`, `fetchUpdateAddon.ts`, `fetchDeleteAddon.ts`.
   - Contract direction: use the dashboard add-ons contract and preserve add-on balance semantics.

2. Manual deduction uses subscription search/manual-deduction endpoints.
   - Current files: `src/components/pages/manual-deduction/ManualDeductionPage.tsx`, `src/utils/fetchDashboardOpsData.ts`, `src/utils/fetchSubscriptionsData.ts`.
   - Contract direction: cashier lookup and customer consumption endpoints under `/api/dashboard/ops/cashier/*`.

3. Operations board still has old queue endpoint usage.
   - Current files: `src/hooks/useOperationsBoard.ts`, `src/utils/fetchDashboardOpsData.ts`, `src/utils/fetchKitchenData.ts`.
   - Contract direction: unified ops list/search/action read model.

4. Delivery endpoint is ambiguous.
   - Contract direction: `GET /api/courier/deliveries/today`, status `NEEDS_TESTS`.
   - Current route uses dashboard ops read model for courier items and older `/api/dashboard/courier/*` helpers exist.

5. Subscriptions contain several business-sensitive frontend mappings.
   - Current files include `src/utils/fetchSubscriptionsData.ts`.
   - Contract direction: show backend read models and lifecycle/audit data. Frontend must not calculate balances or reinterpret add-ons/premium upgrades.

6. Menu has mixed old and new endpoint shapes.
   - Good: `fetchMenuActions.ts` already uses `POST /api/dashboard/menu/validate`, not the old `/validation` route-map name.
   - Risk: `fetchMenuProductGroups.ts` still references `/products/:productId/groups`, while the product customization contract centers `/products/:productId/option-groups`.

7. Profile is using dashboard staff reset behavior.
   - Contract direction: current-user profile via `/api/dashboard/auth/me` and logout via `/api/dashboard/auth/logout`.
   - Current page uses `useResetDashboardStaffUserPasswordMutation` and role-gated admin reset logic.

## Implementation Order

### Phase 1: Establish the Contract Pattern

1. `/dashboard`
   - Reason: `READY`, single endpoint, high visibility.
   - Work: lock UI to `GET /api/dashboard/overview`, render backend-provided KPI/chart/table data, remove derived business calculations, verify loading/empty/error states.

2. `/settings`, `/restaurant-hours`, `/pickup-branches`
   - Reason: `READY`, low cross-domain risk.
   - Work: align methods/payloads and ensure settings-derived branch/hours UI does not invent rules.

3. `/accounting`
   - Reason: `READY`, contained report/export flow.
   - Work: align daily report table/export and keep money formatting display-only.

### Phase 2: Core Admin CRUD

4. `/packages`, `/packages/create`, `/packages/$planId/update`
5. `/promo-codes`
6. `/zones`
7. `/dashboard-users`
8. `/users`, `/users/create`, `/users/$userId`

These are mostly aligned but should be verified field-by-field against contract payloads and backend validation errors.

### Phase 3: Business-Sensitive Subscription Flows

9. `/addons`, `/addons/create`, `/addons/$addonId/update`
10. `/subscriptions`, `/subscriptions/create`, `/subscriptions/$subscriptionId`, `/users/$userId/create-subscription`
11. `/manual-deduction`

This phase must be strict about the no-calculation rules. It should remove `addon-items` assumptions, subscription balance calculations, old manual-deduction endpoints, and any UI logic that treats add-ons or premium upgrades like meal counts.

### Phase 4: Operations and Fulfillment

12. `/operations`
13. `/one-time-orders`, `/one-time-orders/$orderId`
14. `/delivery`

Operations should move to the unified ops read model before delivery is finalized. Delivery needs an explicit decision because the backend delivery contract is `NEEDS_TESTS` and its route prefix differs from the current dashboard ops/courier helpers.

### Phase 5: Menu System

15. `/menu` catalog and product tabs
16. `/menu/products/$productId/update` customization
17. Option groups/options create/update routes
18. Preview/release validation and publish flows

Menu work should be done sub-contract by sub-contract. The `validate` endpoint is already correct in current code; product group customization endpoint names need cleanup.

### Phase 6: Test-Caveat Screens

19. `/notifications`
20. `/profile`

Both backend contracts are `NEEDS_TESTS`. Frontend implementation can align to documented endpoints, but production confidence depends on backend test coverage or manual API verification.

## Recommended First Screen: Dashboard Home

Start with `/dashboard`.

Acceptance checklist:

- Calls only `GET /api/dashboard/overview` for the dashboard overview screen.
- KPI boxes show backend-provided values with stable formatting in light and dark modes.
- Charts are fed by backend overview arrays/series, not reconstructed from unrelated endpoints.
- Recent subscriptions/orders tables use backend row fields directly.
- Empty, loading, and error states are polished and consistent with existing shadcn/TanStack patterns.
- No subscription balance, add-on, premium upgrade, VAT, or pickup fulfillment calculation exists in the dashboard page.

## Backend Clarifications to Request Before Coding Risky Areas

- Is `/api/dashboard/payments/:id/breakdown` part of the dashboard payment contract, or should the UI remove it?
- For add-ons, should all dashboard CRUD move from `/api/dashboard/addon-items` to `/api/dashboard/addons`, and what remains under `/addon-items`?
- Should `/operations` use only `/api/dashboard/ops/list`, `/api/dashboard/ops/search`, and backend-provided action endpoints?
- Is `/delivery` intended to consume `/api/courier/deliveries/today` or the unified ops list filtered to courier items?
- Should subscription audit use `/audit` instead of current `/audit-log`?
- Are menu versions/rollback/public preview endpoints inside the current dashboard contract scope?
- Should profile include password change/reset, or only `/auth/me` and `/auth/logout` for the current contract?

## Verification Plan for Each Implemented Screen

For every screen alignment pass:

1. Read the matching contract file immediately before editing.
2. Update API utility types and endpoint functions first.
3. Update hooks and query keys second.
4. Update route/page rendering last.
5. Remove frontend business calculations and old endpoint fallbacks.
6. Verify light/dark mode layout and Arabic RTL text.
7. Run TypeScript/lint/build checks available in `client_dashbourd`.
8. Use the browser at `http://localhost:5173/<route>` for visual and interaction verification.
9. Record backend contract gaps instead of inventing frontend behavior.

