# Dashboard Final QA Report

## Executive Summary
- Overall status: Not Ready
- Tested branch: main
- Tested commit: 0af3adabf264f42ef73af2b906be271ab34ba1a7
- Backend/base URL: https://basicdiet145.onrender.com
- Browser/device coverage: Chrome headless desktop unauthenticated route smoke; static route/API review. Mobile/tablet, authenticated mutation workflows, RTL visual verification, and dark/light authenticated screens are blocked by missing dashboard test credentials/token.
- Date: 2026-06-28
- Worktree note: QA did not start from a clean checkout. Existing modified files were present before QA: graphify-out files and src/components/layout/nav-user.tsx.

## Command Results
| Command | Status | Notes |
|---|---|---|
| npm install | Pass | Completed. Reported 8 vulnerabilities: 2 low, 2 moderate, 4 high. |
| npm run typecheck | Pass | tsc --noEmit completed with exit code 0. |
| npm run lint | Pass | eslint . completed with exit code 0. |
| npm run build | Pass | tsc -b && vite build completed; 3809 modules transformed. |
| npm run dev | Pass | Vite 7.3.3 served at http://127.0.0.1:5173/. |

## Route Inventory
| Route | File | Protected? | API Dependencies | CRUD/Actions? | Smoke Status |
|---|---|---|---|---|---|
| / | src/routes/index.tsx | Public | /api/dashboard/auth/me, /api/dashboard/auth/login | login | loads |
| /dashboard | src/routes/_protected/dashboard.tsx | Yes | dashboard reports/support data | read/dashboard | redirects correctly without auth |
| /zones | src/routes/_protected/zones/index.tsx | Yes | /api/dashboard/zones, /toggle | create/update/archive/toggle/filter | redirects correctly without auth |
| /users | src/routes/_protected/users/index.tsx | Yes | /api/dashboard/users | list/detail/create | redirects correctly without auth |
| /users/create | src/routes/_protected/users/create.tsx | Yes | /api/dashboard/users | create | redirects correctly without auth |
| /users/$userId | src/routes/_protected/users/$userId/index.tsx | Yes | /api/dashboard/users/:id, /subscriptions | detail/actions | dynamic route not deep-tested |
| /users/$userId/create-subscription | src/routes/_protected/users/$userId/create-subscription.tsx | Yes | /api/dashboard/subscriptions | create | dynamic route not deep-tested |
| /subscriptions | src/routes/_protected/subscriptions/index.tsx | Yes | /api/dashboard/subscriptions, summary | list/filter/actions | redirects correctly without auth |
| /subscriptions/create | src/routes/_protected/subscriptions/create.tsx | Yes | users/plans/zones/subscriptions/quote | create | redirects correctly without auth |
| /subscriptions/$subscriptionId | src/routes/_protected/subscriptions/$subscriptionId/index.tsx | Yes | subscription detail/audit/lifecycle/manual deductions | freeze/unfreeze/extend/cancel/skip | dynamic route not deep-tested |
| /settings | src/routes/_protected/settings/index.tsx | Yes | none on route file | navigation only | redirects correctly without auth |
| /restaurant-hours | src/routes/_protected/restaurant-hours/index.tsx | Yes | /api/dashboard/settings/restaurant-hours | update/toggle/windows | redirects correctly without auth |
| /promo-codes | src/routes/_protected/promo-codes/index.tsx | Yes | /api/dashboard/promo-codes, validate, toggle | create/update/archive/toggle/validate | redirects correctly without auth |
| /profile | src/routes/_protected/profile/index.tsx | Yes | session | read | redirects correctly without auth |
| /premium-meals | src/routes/_protected/premium-meals/index.tsx | Yes | /api/dashboard/premium-upgrades, candidates/readiness | create/update/archive/state | redirects correctly without auth |
| /pickup-branches | src/routes/_protected/pickup-branches/index.tsx | Yes | local/static route review only | create/update/toggle-like UI likely | redirects correctly without auth |
| /payments | src/routes/_protected/payments/index.tsx | Yes | /api/dashboard/payments | list/detail/verify | redirects correctly without auth |
| /packages | src/routes/_protected/packages/index.tsx | Yes | /api/dashboard/plans | create/update/toggle/tiers | redirects correctly without auth |
| /packages/create | src/routes/_protected/packages/create.tsx | Yes | none; redirects to /packages | none at route | redirects correctly without auth |
| /packages/$planId/update | src/routes/_protected/packages/$planId/update.tsx | Yes | /api/dashboard/plans/:id | update | dynamic route not deep-tested |
| /operations | src/routes/_protected/operations/index.tsx | Yes | /api/dashboard/ops/list/actions, queue APIs | workflow actions | redirects correctly without auth |
| /one-time-orders | src/routes/_protected/one-time-orders/index.tsx | Yes | /api/dashboard/orders | list/actions | redirects correctly without auth |
| /one-time-orders/$orderId | src/routes/_protected/one-time-orders/$orderId.tsx | Yes | /api/dashboard/orders/:id/timeline/actions | detail/actions | dynamic route not deep-tested |
| /notifications | src/routes/_protected/notifications/index.tsx | Yes | /api/dashboard/notifications/summary, notification logs | read/filter | redirects correctly without auth |
| /menu | src/routes/_protected/menu/index.tsx | Yes | menu categories/products/options/groups/builder/preview | full CRUD/publish/relations | redirects correctly without auth |
| /menu/products/create | src/routes/_protected/menu/products/create.tsx | Yes | /api/dashboard/menu/products | create | dynamic route blocked by auth |
| /menu/products/$productId/update | src/routes/_protected/menu/products/$productId/update.tsx | Yes | /api/dashboard/menu/products/:id | update | dynamic route not deep-tested |
| /menu/options/create | src/routes/_protected/menu/options/create.tsx | Yes | /api/dashboard/menu/options | create | dynamic route blocked by auth |
| /menu/options/$optionId/update | src/routes/_protected/menu/options/$optionId/update.tsx | Yes | /api/dashboard/menu/options/:id | update | dynamic route not deep-tested |
| /menu/option-groups/create | src/routes/_protected/menu/option-groups/create.tsx | Yes | /api/dashboard/menu/option-groups | create | dynamic route blocked by auth |
| /menu/option-groups/$groupId/update | src/routes/_protected/menu/option-groups/$groupId/update.tsx | Yes | /api/dashboard/menu/option-groups/:id | update | dynamic route not deep-tested |
| /menu/categories/create | src/routes/_protected/menu/categories/create.tsx | Yes | /api/dashboard/menu/categories | create | dynamic route blocked by auth |
| /menu/categories/$categoryId/update | src/routes/_protected/menu/categories/$categoryId/update.tsx | Yes | /api/dashboard/menu/categories/:id | update | dynamic route not deep-tested |
| /manual-deduction | src/routes/_protected/manual-deduction/index.tsx | Yes | /api/dashboard/subscriptions/search, manual-deduction/history | atomic deduction | redirects correctly without auth |
| /delivery | src/routes/_protected/delivery/index.tsx | Yes | /api/courier/deliveries/today, /api/courier/orders/today | courier actions | redirects correctly without auth |
| /dashboard-users | src/routes/_protected/dashboard-users/index.tsx | Yes | /api/dashboard/dashboard-users | user admin actions | redirects correctly without auth |
| /addons | src/routes/_protected/addons/index.tsx | Yes | /api/dashboard/addons | create/update/archive/toggle | redirects correctly without auth |
| /addons/create | src/routes/_protected/addons/create.tsx | Yes | none; redirects to /addons | none at route | redirects correctly without auth |
| /addons/$addonId/update | src/routes/_protected/addons/$addonId/update.tsx | Yes | none; redirects to /addons | none at route | dynamic route not deep-tested |
| /accounting | src/routes/_protected/accounting/index.tsx | Yes | /api/dashboard/accounting/daily-report/export | report/export | redirects correctly without auth |

## Route Smoke Results
| Route | Load Status | Console Errors | Network Errors | Notes |
|---|---|---|---|---|
| / | loads | none | none | Login form rendered. Dev-only Vite/React DevTools messages seen. |
| All protected static routes listed above | redirects correctly | none | none during route-load smoke | Final URL became /?redirect=<route>. |
| Dynamic ID routes | blocked by auth/test data | not tested | not tested | Need valid IDs and authenticated session. |

## Screen Coverage
| Screen | Load | Actions | API | Mobile | Theme | Result |
|---|---|---|---|---|---|---|
| Login | Yes | Form visible only; credentials unavailable | auth/me checked by route flow | Not visually verified | Not visually verified | Partial pass |
| Protected dashboard screens | Redirect only | Blocked | Source reviewed | Blocked | Blocked | Environment-blocked |
| Settings | Source verified | Navigation only by source | No API in route file | Blocked | Blocked | Source pass, browser auth-blocked |
| Promo Codes/Zones/Restaurant Hours/Premium/Manual Deduction/Operations/Delivery/Menu | Redirect only | Auth/test data blocked | Source reviewed for contracts | Blocked | Blocked | Not complete |

## Final Issue Register
| ID | Severity | Owner | Route | Action/API | Issue | Evidence | Reproduce Steps | Expected | Actual | Suggested Fix | Fix Before Refactor? | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QA-001 | P1 Critical | Environment / Test Data | all protected routes | all authenticated workflows | Deep dashboard QA is blocked by missing valid dashboard credentials/token and seed data. | Chrome route smoke: every protected route redirects to /?redirect=...; direct GET /api/dashboard/zones returns 401 Missing dashboard token. | Open /zones or /promo-codes without a valid dashboardToken. | Authenticated QA account can load and mutate safe test records. | Login page only; mutation workflows cannot be verified. | Provide QA admin/kitchen/courier users, safe seed data, and destructive-action rules. | Yes | Open |
| QA-002 | P2 Major | Security / Frontend dependency | repo | npm install/audit | Dependency audit reports 8 vulnerabilities, including high severity issues in form-data, hono, js-cookie, and vite. | npm audit output, 2026-06-28. | Run npm audit --audit-level=low. | No known high severity dependency advisories before refactor/release. | 4 high, 2 moderate, 2 low vulnerabilities. | Run controlled dependency update and regression test; do not blind npm audit fix on release branch. | Yes, if release-bound | Open |
| QA-003 | P1 Critical | Integration / Contract | /delivery | list/actions | Dashboard delivery screen uses courier-app endpoints instead of dashboard endpoints. | src/utils/fetchCourierDeliveries.ts:141-142 calls /api/courier/deliveries/today and /api/courier/orders/today; actions use /api/courier/... at lines 182 and 207. | Load /delivery with dashboard token and inspect network. | Dashboard route should use documented dashboard-owned delivery/ops contract or explicitly approved courier contract. | Source shows courier contract use. | Confirm backend ownership; migrate to /api/dashboard delivery/ops endpoint if dashboard should not call courier APIs. | Yes | Open |
| QA-004 | P1 Critical | Frontend / Integration | /delivery, /operations courier board | courier actions | Courier delivery actions are synthesized from boolean flags instead of backend allowedActions objects. | src/utils/fetchCourierDeliveries.ts:28-70 builds actions from canCourierPickup/canMarkArrivingSoon/canMarkDelivered/canCancel. | Load /delivery with test data containing action flags. | Actions must come from backend allowedActions and be deduped. | Frontend creates allowedActions locally for courier data. | Backend should return canonical allowedActions or frontend should adapt only that field, not infer workflow. | Yes | Open |
| QA-005 | P1 Critical | Integration / Contract | /promo-codes | archive | UI says archive/disable, but API function uses DELETE /api/dashboard/promo-codes/:id. Data-loss semantics are unclear. | src/utils/fetchPromoCodesData.ts:136-137; UI archive wording in src/components/pages/promo-codes/PromoCodesTable.tsx:447-469. | Archive a promo code and inspect network. | Archive should call a soft-delete/archive endpoint or DELETE must be documented as soft archive. | Frontend sends DELETE while promising archive. | Confirm backend semantics; rename function or use POST/PATCH archive endpoint. | Yes | Open |
| QA-006 | P1 Critical | Integration / Contract | /zones | archive/disable | UI says zone is disabled and not permanently deleted, but API function uses DELETE /api/dashboard/zones/:id. | src/utils/fetchDeliveryZonesData.ts:114-117; UI wording src/components/pages/zones/ZonesTable.tsx:275-284. | Disable/archive a zone and inspect network. | Disable/archive should be soft and contractually clear. | Frontend sends DELETE while UI says not deleted. | Confirm backend soft-delete behavior or replace with explicit archive/disable endpoint. | Yes | Open |
| QA-007 | P2 Major | Backend / Contract | /api/dashboard/auth/me | unauth session | Unauthenticated /auth/me returns HTTP 200 with status:false/user:null, while protected resources return 401. | Direct request: GET /api/dashboard/auth/me returned 200 {"status":false,"data":{"user":null},"user":null}; GET /api/dashboard/zones returned 401 Missing dashboard token. | Call both endpoints without token. | Auth contract should be consistent and documented. | Mixed 200 false envelope and 401 error envelope. | Backend/API docs should define auth/me behavior; frontend is currently tolerant. | Before refactor if auth contracts are being cleaned | Open |
| QA-008 | P3 Minor | Frontend UX / Route | /packages/create, /addons/create, /addons/$addonId/update | direct navigation | Direct create/update routes redirect to list routes instead of rendering create/update screens. | src/routes/_protected/packages/create.tsx:3-6; src/routes/_protected/addons/create.tsx:3-5; addons update route also redirects by source. | Navigate directly to /packages/create or /addons/create while authenticated. | Direct route should either not exist or should render/create screen consistently. | Route exists but immediately redirects. | Remove stale routes or document list-dialog workflow; update nav links/tests. | No, unless linked externally | Open |
| QA-009 | P3 Minor | QA Process | repo | baseline | Required clean checkout condition was not met. | git status before QA showed modified graphify-out files and src/components/layout/nav-user.tsx. | Run git status --short --branch. | Clean worktree or explicit baseline exception. | Dirty worktree before QA. | Preserve user changes; rerun final QA after clean checkout if signoff requires it. | No | Open |

## Frontend Issues To Fix
- QA-004: Stop synthesizing courier workflow actions from frontend booleans unless backend explicitly owns those booleans as the allowed action contract.
- QA-008: Remove or implement stale direct create/update routes.

## Backend Issues To Fix
- QA-007: Normalize/document unauthenticated /api/dashboard/auth/me response semantics.
- QA-002 may require dependency updates if these advisories are in frontend transitive runtime/build dependencies only; backend should separately audit its own repo.

## Integration / Contract Issues To Resolve
- QA-003: Delivery dashboard endpoint ownership.
- QA-005: Promo archive DELETE versus soft archive contract.
- QA-006: Zone archive DELETE versus soft disable contract.

## Environment / Test Data Issues
- QA-001: No valid dashboard token/test account, no seeded safe records, and no role matrix were available. This blocks browser-level CRUD, forms, mutation payload verification, mobile authenticated screens, and dark/light authenticated screen review.

## Unknown Issues Requiring More Evidence
- Authenticated console/network errors on protected screens.
- Backend responses for create/update/delete/archive/toggle workflows.
- Mobile/tablet clipping in dialogs and tables.
- Dark/light mode regressions in authenticated layout.
- RTL visual correctness beyond source-level dir="rtl" checks.

## P0/P1 Fix List Before Refactor
- QA-001: Provide test credentials and data, then rerun authenticated QA.
- QA-003: Resolve delivery dashboard endpoint ownership.
- QA-004: Resolve backend-owned allowedActions contract for courier delivery.
- QA-005: Confirm or fix promo archive semantics.
- QA-006: Confirm or fix delivery-zone archive semantics.

## P2/P3 Fix List Before Refactor
- QA-002: Address dependency vulnerabilities or explicitly accept for non-release QA.
- QA-007: Normalize/document auth/me contract.
- QA-008: Clean stale direct create/update routes.
- QA-009: Rerun from clean checkout for formal signoff.

## P4 Refactor Inputs For Later
- Consolidate API contract constants so archive/delete/toggle endpoints are self-documenting.
- Add authenticated E2E tests around route access and mutation payloads.
- Add role-based fixture accounts for admin, kitchen, courier, and restricted dashboard users.

## API Contract Findings
| Screen | Endpoint | Method | Payload OK? | Owner if Broken | Notes |
|---|---|---|---|---|---|
| Auth | /api/dashboard/auth/login | POST | Not tested | Environment | Credentials unavailable. |
| Auth | /api/dashboard/auth/me | GET | N/A | Backend / Contract | Returns 200 false envelope unauthenticated. |
| Zones | /api/dashboard/zones | GET/POST | Source OK for q/isActive and deliveryFeeHalala | Unknown | Runtime blocked by auth. |
| Zones | /api/dashboard/zones/:id | PUT/DELETE | Archive semantics unclear | Integration / Contract | DELETE is used for UI "disable/archive". |
| Zones | /api/dashboard/zones/:id/toggle | PATCH | Source OK | Unknown | Runtime blocked by auth. |
| Promo Codes | /api/dashboard/promo-codes | GET/POST | Source converts fixed SAR to halalas | Unknown | Runtime blocked by auth. |
| Promo Codes | /api/dashboard/promo-codes/:id | GET/PUT/DELETE | Archive semantics unclear | Integration / Contract | DELETE is used for archive UI. |
| Promo Codes | /api/dashboard/promo-codes/:id/toggle | PATCH | Source OK | Unknown | Runtime blocked by auth. |
| Promo Codes | /api/dashboard/promo-codes/validate | POST | Source sends subtotalHalala | Unknown | Runtime blocked by auth. |
| Restaurant Hours | /api/dashboard/settings/restaurant-hours | GET/PUT | Source uses canonical new payload fields | Unknown | Accepts weekly_schedule only as read fallback; PUT uses restaurant_hours. |
| Premium Upgrades | /api/dashboard/premium-upgrades | GET/POST/PATCH | Source converts SAR to upgradeDeltaHalala | Unknown | Runtime blocked by auth. |
| Premium Candidates | /api/dashboard/premium-upgrades/candidates | GET | Source uses candidates endpoint | Unknown | Runtime blocked by auth. |
| Manual Deduction | /api/dashboard/subscriptions/search | GET | Unknown | Unknown | Runtime blocked by auth. |
| Manual Deduction | /api/dashboard/subscriptions/:id/manual-deduction | POST | Unknown | Unknown | Runtime blocked by auth. |
| Operations | /api/dashboard/ops/list | GET | Unknown | Unknown | Runtime blocked by auth. |
| Operations | /api/dashboard/ops/actions/:action | POST | Source builds entity/source/action payload | Unknown | Runtime blocked by auth. |
| Delivery | /api/courier/deliveries/today, /api/courier/orders/today | GET | Contract questionable | Integration / Contract | Dashboard route uses courier endpoints. |
| Delivery | /api/courier/deliveries/:id/:action, /api/courier/orders/:id/:action | PUT | Contract questionable | Integration / Contract | Dashboard route mutates courier endpoints. |

## Unit Conversion Findings
| Screen | Field | Expected Unit | Actual Unit | Status |
|---|---|---|---|---|
| Promo Codes | fixed discount | UI SAR, payload halalas | Math.round(Number(value) * 100) in PromoCodeDialog | Source pass, runtime unverified |
| Promo Codes | display fixed discount | SAR from halalas | formatHalala(value / 100) | Source pass, runtime unverified |
| Promo Validate | subtotal | UI SAR, payload subtotalHalala | Math.round(parsed * 100) | Source pass, runtime unverified |
| Delivery Zones | deliveryFee | UI SAR, payload deliveryFeeHalala | Math.round(Number(value) * 100) | Source pass, runtime unverified |
| Delivery Zones | display fee | SAR from deliveryFeeHalala | deliveryFeeHalala / 100 | Source pass, runtime unverified |
| Premium Upgrades | upgradeDelta | UI SAR, payload upgradeDeltaHalala | Math.round(Number(value) * 100) | Source pass, runtime unverified |

## Security / Robustness Findings
- Protected routes fail safely without auth by redirecting to login with intended redirect preserved.
- Missing token on protected API returns 401 for /api/dashboard/zones.
- npm audit reports high severity vulnerabilities, including js-cookie and vite advisories.
- No sensitive token was printed by the app during unauthenticated route smoke.
- 401/500 authenticated screen handling is not verified because no test token was available.

## Performance Findings
- Production build completed successfully.
- Unauthenticated route smoke did not show infinite request loops.
- Authenticated list/table/chart request duplication is unverified due to missing credentials.

## Safe Fixes Applied During QA
| Issue ID | File(s) Changed | What Changed | Why Safe |
|---|---|---|---|
| None | None | No code fixes applied. | App builds/runs; high-risk findings need contract/test data confirmation. |

## Risks Remaining
- This is not a complete senior QA signoff because authenticated CRUD/action testing could not be executed.
- The highest data-risk findings are archive/delete semantics and delivery workflow contract ownership.
- Any refactor started before resolving QA-001 would be refactoring an insufficiently tested dashboard.

## Release Recommendation
Not ready - fix frontend and backend issues first

## Pre-Auth QA Continuation Work

This section documents QA work completed while authenticated backend test credentials and safe seed data are pending.

These results are not a replacement for authenticated runtime QA.

### Status Vocabulary
- `Verified Runtime`: action was executed in browser/API with valid auth and real safe test data.
- `Verified Source`: route, API call, payload mapping, or UI intent was verified from source only.
- `Blocked by Auth`: cannot run because a valid dashboard session/token is missing.
- `Blocked by Test Data`: cannot run because safe records/IDs/states are missing.
- `Blocked by Backend Contract`: cannot finish until backend confirms endpoint, payload, or semantics.
- `Needs Runtime Retest`: source looks plausible but must be retested with auth/data.

## Complete Route Action Matrix

| Route | File | Screen | Role | Action | Type | Expected API | Method | Payload Fields | Success Behavior | Error Behavior | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| / | src/routes/index.tsx | Login | public | submit login | validate/create session | /api/dashboard/auth/login | POST | email, password | stores dashboardToken, redirects by role/default | validation/error toast, no token stored | Needs Runtime Retest | Login form was visible unauthenticated; credentials missing. |
| /dashboard | src/routes/_protected/dashboard.tsx | Dashboard overview | admin/superadmin/cashier | load cards/charts/activity | read | dashboard query/support endpoints | GET | date/filter params if present | cards/charts render and refetch safely | error state, no crash | Blocked by Auth | Needs real admin/cashier token. |
| /users | src/routes/_protected/users/index.tsx | Customers | admin/superadmin/cashier | list/search/paginate | read/search/filter | /api/dashboard/users | GET | page, limit, q | table updates, pagination stable | inline/table error | Blocked by Auth | Needs customer fixtures. |
| /users/create | src/routes/_protected/users/create.tsx | Create Customer | admin/superadmin/cashier | create customer | create/validate | /api/dashboard/users | POST | name, phone, email/address fields per form | success toast, users query invalidated, navigate/list update | validation errors and API error toast | Blocked by Auth | Needs safe phone/email values. |
| /users/$userId | src/routes/_protected/users/$userId/index.tsx | Customer Details | admin/superadmin/cashier | load details/subscriptions | read | /api/dashboard/users/:userId, /subscriptions | GET | userId | details and subscription list render | detail error/empty state | Blocked by Test Data | Needs users with and without subscriptions. |
| /users/$userId/create-subscription | src/routes/_protected/users/$userId/create-subscription.tsx | Create Subscription For User | admin/superadmin/cashier | create subscription | create/validate | /api/dashboard/subscriptions, /quote | POST | userId, planId, dates, delivery, addons, premium meals | quote then create succeeds, lists invalidate | validation/API error | Blocked by Test Data | Needs active plans, zones, customer. |
| /subscriptions | src/routes/_protected/subscriptions/index.tsx | Subscriptions | admin/superadmin/cashier | list/filter/search/paginate | read/search/filter | /api/dashboard/subscriptions, /summary | GET | status, page, limit, q | table and summary update | error/empty state | Blocked by Auth | Needs subscription fixtures. |
| /subscriptions/create | src/routes/_protected/subscriptions/create.tsx | Create Subscription | admin/superadmin/cashier | quote and create | validate/create | /api/dashboard/subscriptions/quote, /api/dashboard/subscriptions | POST | userId, planId, startDate, delivery, addons, premium selections | quote shown, create success, navigation/list invalidation | field validation and quote/create error | Blocked by Test Data | Needs customer, plan, zone, menu fixtures. |
| /subscriptions/$subscriptionId | src/routes/_protected/subscriptions/$subscriptionId/index.tsx | Subscription Details | admin/superadmin/cashier | details/audit/lifecycle/history | read | /api/dashboard/subscriptions/:id, audit-log, lifecycle, manual-deductions | GET | subscriptionId | detail panels render | per-panel error/route error | Blocked by Test Data | Needs valid active subscription. |
| /subscriptions/$subscriptionId | src/routes/_protected/subscriptions/$subscriptionId/index.tsx | Subscription Details | admin/superadmin/cashier | freeze/unfreeze/extend/cancel/skip/unskip/update delivery/balances/addons | update/toggle | /api/dashboard/subscriptions/:id/... | POST/PUT/PATCH | reason, dates, delivery fields, balances, addon entitlements | success toast, subscription/list invalidation | backend validation error shown | Blocked by Test Data | Must verify backend is final authority. |
| /settings | src/routes/_protected/settings/index.tsx | Settings Guide | admin/superadmin | navigate owner cards | read/navigation | none on mount | N/A | N/A | links route to zones/premium/menu/hours/subscriptions | no API failure possible | Verified Source | Source confirms navigation-only, no form/save/API. |
| /restaurant-hours | src/routes/_protected/restaurant-hours/index.tsx | Restaurant Hours | admin/superadmin | load hours | read | /api/dashboard/settings/restaurant-hours | GET | none | form initializes from canonical fields | error state/toast | Blocked by Auth | Source supports restaurant_hours with weekly_schedule read fallback. |
| /restaurant-hours | src/routes/_protected/restaurant-hours/index.tsx | Restaurant Hours | admin/superadmin | save hours/windows/temp closure | update/validate/toggle | /api/dashboard/settings/restaurant-hours | PUT | restaurant_open_time, restaurant_close_time, restaurant_is_open, cutoff_time, delivery_windows, restaurant_hours, temporary_closure | success toast, restaurantHours query invalidated | duplicate/format validation, API error | Needs Runtime Retest | Source validates duplicate/window format. |
| /promo-codes | src/routes/_protected/promo-codes/index.tsx | Promo Codes | admin/superadmin | list/search/filter/paginate/details/charts | read/search/filter | /api/dashboard/promo-codes, /:id | GET | includeDeleted, local filters | table/detail/charts render | error/empty state | Blocked by Auth | Needs active/archived promo fixtures. |
| /promo-codes | src/routes/_protected/promo-codes/index.tsx | Promo Codes | admin/superadmin | create/update percentage/fixed code | create/update/validate | /api/dashboard/promo-codes, /:id | POST/PUT | code, name, discountType, discountValue, limits, appliesTo, dates, isActive | toast, list/detail invalidation | form/API validation shown | Needs Runtime Retest | Fixed SAR converted to halalas by source. |
| /promo-codes | src/routes/_protected/promo-codes/index.tsx | Promo Codes | admin/superadmin | toggle active | toggle | /api/dashboard/promo-codes/:id/toggle | PATCH | id | toast, list/detail invalidation | API error toast | Blocked by Test Data | Needs inactive/active codes. |
| /promo-codes | src/routes/_protected/promo-codes/index.tsx | Promo Codes | admin/superadmin | archive code | archive/delete | /api/dashboard/promo-codes/:id | DELETE | id | toast says archived/disabled | API error toast | Blocked by Backend Contract | DELETE semantics must be confirmed as soft archive. |
| /promo-codes | src/routes/_protected/promo-codes/index.tsx | Promo Codes | admin/superadmin | validate code preview | validate | /api/dashboard/promo-codes/validate | POST | promoCode, userId?, planId?, daysCount?, subtotalHalala?, vatPercentage? | backend result displayed | validation/API toast | Needs Runtime Retest | Dialog says backend computes final discount. |
| /zones | src/routes/_protected/zones/index.tsx | Delivery Zones | admin/superadmin | list/search/filter/charts | read/search/filter | /api/dashboard/zones | GET | q, isActive | table/charts update | empty/error state | Blocked by Auth | Search/filter source verified. |
| /zones | src/routes/_protected/zones/index.tsx | Delivery Zones | admin/superadmin | create/update zone | create/update/validate | /api/dashboard/zones, /:id | POST/PUT | name.ar, name.en, deliveryFeeHalala, isActive, sortOrder | toast, list/detail invalidation | required name/fee errors | Needs Runtime Retest | SAR to halalas source verified. |
| /zones | src/routes/_protected/zones/index.tsx | Delivery Zones | admin/superadmin | toggle active | toggle | /api/dashboard/zones/:id/toggle | PATCH | id | toast, list/detail invalidation | API error toast | Blocked by Test Data | Needs active/inactive zone. |
| /zones | src/routes/_protected/zones/index.tsx | Delivery Zones | admin/superadmin | archive/disable zone | archive/delete | /api/dashboard/zones/:id | DELETE | id | toast says disabled/not permanently deleted | API error toast | Blocked by Backend Contract | DELETE semantics must be confirmed as soft disable. |
| /premium-meals | src/routes/_protected/premium-meals/index.tsx | Premium Upgrades | admin/superadmin | readiness/list/candidates/filter | read/search/filter | /api/dashboard/premium-upgrades/readiness, /premium-upgrades, /candidates | GET | filters, candidate params | tables/cards render | loading/empty/error cards | Blocked by Auth | Candidate endpoint source verified. |
| /premium-meals | src/routes/_protected/premium-meals/index.tsx | Premium Upgrades | admin/superadmin | link/create/edit/state/archive | create/update/toggle/archive | /api/dashboard/premium-upgrades, /:id, /:id/state, /:id/archive | POST/PATCH/POST | candidate fields, upgradeDeltaHalala, display/order/state | toast, premium queries invalidated | validation/API toast | Needs Runtime Retest | SAR to halalas source verified. |
| /pickup-branches | src/routes/_protected/pickup-branches/index.tsx | Pickup Branches | admin/superadmin | list/manage branches | create/update/toggle | route-local/dashboard branch contract | TBD | branch name/address/status fields | branch UI updates | validation/API error | Blocked by Backend Contract | Endpoint ownership needs runtime/source follow-up before signoff. |
| /payments | src/routes/_protected/payments/index.tsx | Payments | admin/superadmin/cashier | list/filter/detail/breakdown | read/filter | /api/dashboard/payments, /:id, /:id/breakdown | GET | page/status/date/q/id | table/detail render | error state | Blocked by Auth | Needs paid/pending/failed fixtures. |
| /payments | src/routes/_protected/payments/index.tsx | Payments | admin/superadmin/cashier | verify payment | update/action | /api/dashboard/payments/:id/verify | POST | payment id | toast/refetch | API error toast | Blocked by Test Data | Needs safe pending payment. |
| /packages | src/routes/_protected/packages/index.tsx | Packages/Plans | admin/superadmin | list/create/update/toggle/tiers | CRUD/toggle | /api/dashboard/plans, /:id, /:id/toggle, /:id/grams | GET/POST/PUT/PATCH/POST | plan fields, grams, meals, policies | toast, packages query invalidated | validation/API toast | Blocked by Auth | /packages/create route redirects to /packages. |
| /operations | src/routes/_protected/operations/index.tsx | Operations Board | admin/superadmin/kitchen/courier | load queue/search/tabs/charts/details | read/search/filter | /api/dashboard/ops/list, /api/dashboard/ops/search | GET | date, q | role-visible screens render | error state, refetch stable | Blocked by Auth | Source refetches every 30s. |
| /operations | src/routes/_protected/operations/index.tsx | Operations Board | admin/superadmin/kitchen/courier | execute allowed action | action/update | action.endpoint or /api/dashboard/ops/actions/:action | method from action or POST | entityId, entityType, source, action, reason, note, payload | success toast, queue invalidated | error toast, queue invalidated | Needs Runtime Retest | Source uses backend allowedActions when available. |
| /one-time-orders | src/routes/_protected/one-time-orders/index.tsx | One-Time Orders | admin/superadmin/kitchen/cashier | list/filter/detail | read/filter | /api/dashboard/orders, /:orderId, /timeline | GET | query params, orderId | table/detail render | error/empty state | Blocked by Auth | Needs pending/kitchen/pickup fixtures. |
| /one-time-orders/$orderId | src/routes/_protected/one-time-orders/$orderId.tsx | One-Time Order Detail | admin/superadmin/kitchen/cashier | prepare/ready/fulfill/cancel | action/update | /api/dashboard/orders/:orderId/actions/:action | POST | reason?, notes?, pickupCode? | toast, detail/list invalidation | confirm dialog/API error | Blocked by Test Data | Must verify action list from backend allowedActions. |
| /notifications | src/routes/_protected/notifications/index.tsx | Notifications | admin/superadmin | load summary/logs/filter | read/filter | /api/dashboard/notifications/summary, /api/dashboard/notification-logs | GET | limit, log filters | summary/logs render | per-query error | Blocked by Auth | Needs notification log fixtures. |
| /menu | src/routes/_protected/menu/index.tsx | Menu / Meal Builder | admin/superadmin | categories/products/options/groups list/filter | read/filter | /api/dashboard/menu/* | GET | page, q, visibility/status filters | tabs/tables render | empty/error state | Blocked by Auth | Needs menu catalog fixtures. |
| /menu | src/routes/_protected/menu/index.tsx | Menu / Meal Builder | admin/superadmin | create/update/archive/toggle/reorder/duplicate/publish/relations | CRUD/toggle/action | /api/dashboard/menu/* endpoints | POST/PATCH/DELETE | entity form fields, visibility, availability, relation ids, reorder items | toast, menu queries invalidated | validation/API toast | Needs Runtime Retest | Product-specific relation safety must be verified. |
| /manual-deduction | src/routes/_protected/manual-deduction/index.tsx | Manual Deduction | admin/superadmin | search subscription by phone | search/read | /api/dashboard/subscriptions/search | GET | phone | subscription picker/balances render | no-results/error state | Blocked by Test Data | Needs phone fixtures. |
| /manual-deduction | src/routes/_protected/manual-deduction/index.tsx | Manual Deduction | admin/superadmin | submit deduction | create/action | /api/dashboard/subscriptions/:id/manual-deduction | POST | regularMeals, premiumMeals, addon deductions?, reason, notes | backend balances update, history invalidated | empty submission blocked, insufficient balance error | Needs Runtime Retest | Verify add-ons are included atomically if UI supports. |
| /delivery | src/routes/_protected/delivery/index.tsx | Delivery Dashboard | admin/superadmin/courier | list/cards/filter/reset/charts | read/filter | /api/courier/deliveries/today, /api/courier/orders/today | GET | date currently ignored by endpoint | delivery cards render | error/empty state | Blocked by Backend Contract | Dashboard screen uses courier endpoint family. |
| /delivery | src/routes/_protected/delivery/index.tsx | Delivery Dashboard | admin/superadmin/courier | courier actions | action/update | /api/courier/deliveries/:id/:action, /api/courier/orders/:id/:action | PUT | reason?, note? | toast, courier/accounting queries invalidated | API error toast | Blocked by Backend Contract | Actions synthesized from booleans in source. |
| /dashboard-users | src/routes/_protected/dashboard-users/index.tsx | Dashboard Users | admin/superadmin | list/create/update/delete/reset password | CRUD/action | /api/dashboard/dashboard-users, /:id, /:id/reset-password | GET/POST/PUT/DELETE/POST | staff user fields, role, password/reset | toast, staff query invalidated | validation/API toast | Blocked by Auth | Needs safe staff accounts. |
| /addons | src/routes/_protected/addons/index.tsx | Add-ons | admin/superadmin | list/create/update/toggle/archive | CRUD/toggle/archive | /api/dashboard/addons, /:id, /:id/toggle | GET/POST/PUT/PATCH/DELETE | addon fields, prices, linked products/plans | toast, addons query invalidated | validation/API toast | Blocked by Auth | /addons/create and update routes redirect to list. |
| /accounting | src/routes/_protected/accounting/index.tsx | Accounting | admin/superadmin | load daily report/filter | read/filter | /api/dashboard/accounting/daily-report | GET | date/status params | report cards/tables render | error state | Blocked by Auth | Needs finance data. |
| /accounting | src/routes/_protected/accounting/index.tsx | Accounting | admin/superadmin | export daily report | export | /api/dashboard/accounting/daily-report/export | GET | date/status params, format | file/download response | export error toast | Blocked by Test Data | Needs report rows. |

## Manual QA Scripts

Use these scripts after credentials and safe data are available. Every protected runtime result remains pending until then.

### Manual QA Script: /dashboard
- Preconditions: admin/superadmin/cashier; dashboard report rows for today; dashboard summary contract available.
- Navigation: log in, open `/dashboard` from sidebar, refresh direct URL.
- Read/List Tests: verify cards, charts, recent activity, loading, empty, and 500 states.
- Create Tests: not supported.
- Update Tests: not supported except refresh/refetch.
- Delete/Archive/Disable Tests: not supported.
- Validation Tests: test 401/403/500 and empty dashboard data.
- Network Verification: `GET` dashboard report/support endpoints, query params only, expect summary/cards/chart data.
- Expected UI Checks: no infinite requests; mobile cards stack; dark/light charts readable; RTL labels and LTR numbers are coherent.

### Manual QA Script: /users
- Preconditions: admin/superadmin/cashier; customers with no subscription and active subscription; `/api/dashboard/users` pagination/search.
- Navigation: open `/users`, open a row detail.
- Read/List Tests: list, search, pagination, empty state, mobile phone/name visibility.
- Create Tests: use create customer route/button with safe phone/email.
- Update Tests: edit customer if exposed; confirm list/detail refresh.
- Delete/Archive/Disable Tests: only if UI exposes it; confirm safe destructive wording.
- Validation Tests: missing name/phone, invalid phone/email, duplicate phone.
- Network Verification: `GET /api/dashboard/users`, `POST /api/dashboard/users`, `GET /api/dashboard/users/:userId`; expect paginated list/user envelopes.
- Expected UI Checks: table loader, useful error, mutation toast, query invalidation, dark/light contrast, RTL form labels.

### Manual QA Script: /users/create
- Preconditions: admin/superadmin/cashier; unused safe phone/email; user validation contract.
- Navigation: open `/users/create`, cancel/back to `/users`.
- Read/List Tests: blank form loads; role restrictions hold.
- Create Tests: submit valid safe user; verify appears in list.
- Update Tests: not supported on create route.
- Delete/Archive/Disable Tests: not supported.
- Validation Tests: empty form, invalid phone/email, duplicate phone.
- Network Verification: `POST /api/dashboard/users` with user form fields; expect created user.
- Expected UI Checks: pending save button, field/API errors, success toast, mobile inputs not clipped, RTL labels.

### Manual QA Script: /users/$userId
- Preconditions: admin/superadmin/cashier; one user without subscriptions and one with active subscription.
- Navigation: open from `/users`, direct-open `/users/<id>`.
- Read/List Tests: profile values and subscription history/list.
- Create Tests: start create subscription from detail if available.
- Update Tests: edit profile if available and verify backend response.
- Delete/Archive/Disable Tests: only if UI exposes it; confirm backend semantics.
- Validation Tests: invalid ID, missing user/404.
- Network Verification: `GET /api/dashboard/users/:userId`, `GET /api/dashboard/users/:userId/subscriptions`.
- Expected UI Checks: detail skeleton, no-subscriptions empty copy, useful 404, mobile actions accessible.

### Manual QA Script: /subscriptions
- Preconditions: admin/superadmin/cashier; active, frozen, cancelled, expired subscriptions.
- Navigation: open `/subscriptions`, open a detail row.
- Read/List Tests: summary counts, list, search/filter/sort/pagination.
- Create Tests: navigate to `/subscriptions/create`.
- Update Tests: trigger safe detail/list actions if present.
- Delete/Archive/Disable Tests: cancel safe subscription only.
- Validation Tests: invalid filters, 401/500 handling.
- Network Verification: `GET /api/dashboard/subscriptions/summary`, `GET /api/dashboard/subscriptions` with status/page/limit/q.
- Expected UI Checks: table/cards skeleton, no-subscriptions empty state, status badge contrast, list invalidation.

### Manual QA Script: /subscriptions/create
- Preconditions: admin/superadmin/cashier; customer, active plan, zone, optional add-ons/premium upgrades.
- Navigation: open `/subscriptions/create`, complete every form section.
- Read/List Tests: users/plans/zones/addons/premium options load and empty option lists do not crash.
- Create Tests: regular subscription; subscription with delivery, add-ons, premium upgrades.
- Update Tests: not supported, but quote should recompute after changes.
- Delete/Archive/Disable Tests: not supported; cancel/back should not mutate.
- Validation Tests: missing user/plan/start date, invalid delivery/zone/add-on quantities.
- Network Verification: `POST /api/dashboard/subscriptions/quote`, `POST /api/dashboard/subscriptions`; expect quote then created subscription.
- Expected UI Checks: option loaders, quote/create errors, created toast, users/subscriptions invalidation, mobile sections usable.

### Manual QA Script: /subscriptions/$subscriptionId
- Preconditions: admin/superadmin/cashier; active subscription with days, balances, delivery, add-ons, premium meals.
- Navigation: open from `/subscriptions`, direct-open `/subscriptions/<id>`.
- Read/List Tests: details, audit, lifecycle, days, balances, manual deduction history.
- Create Tests: only manual/add-on entitlement actions if exposed.
- Update Tests: freeze/unfreeze, extend, update delivery, update balances/addons, skip/unskip future day.
- Delete/Archive/Disable Tests: cancel safe subscription with reason.
- Validation Tests: invalid dates/reasons/balance changes.
- Network Verification: `GET /api/dashboard/subscriptions/:id`, `POST /freeze`, `POST /unfreeze`, `PUT /extend`, `POST /cancel`, day skip/unskip endpoints.
- Expected UI Checks: per-section loading/errors, mutation toasts, detail/list invalidation, dialogs fit on mobile.

### Manual QA Script: /settings
- Preconditions: admin/superadmin; no data required; navigation-only contract.
- Navigation: open `/settings`, click each owner card.
- Read/List Tests: no API request on mount; cards route to zones, premium, menu, restaurant hours, subscriptions.
- Create Tests: not supported; verify no form inputs.
- Update Tests: not supported; verify no save button.
- Delete/Archive/Disable Tests: not supported; VAT card informational only.
- Validation Tests: role access and logged-out redirect.
- Network Verification: no API on page load.
- Expected UI Checks: mobile card stack, dark/light contrast, Arabic copy clear.

### Manual QA Script: /restaurant-hours
- Preconditions: admin/superadmin; existing restaurant-hours settings; canonical GET/PUT contract.
- Navigation: open `/restaurant-hours`, change only test-safe settings.
- Read/List Tests: canonical fields populate; `isOpenNow` readonly display.
- Create Tests: not supported; add delivery window rows.
- Update Tests: save open/close time, cutoff, manual open, closed days, temporary closure.
- Delete/Archive/Disable Tests: not supported; closed day is update/toggle.
- Validation Tests: duplicate delivery window, invalid `HH:mm-HH:mm`.
- Network Verification: `GET/PUT /api/dashboard/settings/restaurant-hours`; PUT payload `restaurant_open_time`, `restaurant_close_time`, `restaurant_is_open`, `cutoff_time`, `delivery_windows`, `restaurant_hours`, `temporary_closure`.
- Expected UI Checks: loader, save error/success toast, restaurantHours invalidation, time fields LTR where needed.

### Manual QA Script: /promo-codes
- Preconditions: admin/superadmin; unused, used, active, inactive, archived, percentage, and fixed promo codes; archive DELETE decision.
- Navigation: open `/promo-codes`, open create/detail/validate/archive dialogs.
- Read/List Tests: list, filters, local search, pagination, charts, detail, recent usage.
- Create Tests: percentage promo; fixed SAR promo with halala payload.
- Update Tests: edit fields; toggle active/inactive.
- Delete/Archive/Disable Tests: archive safe code; verify soft archive.
- Validation Tests: missing/duplicate code, invalid appliesTo/money/usage, validation dialog.
- Network Verification: `GET/POST/PUT/DELETE /api/dashboard/promo-codes`, `PATCH /:id/toggle`, `POST /validate`.
- Expected UI Checks: table/chart loading, no-promos empty, mutation toasts, list/detail invalidation, mobile dialogs, code fields LTR.

### Manual QA Script: /zones
- Preconditions: admin/superadmin; active/inactive zone; safe new zone; DELETE soft-disable decision.
- Navigation: open `/zones`, use filter/search, open create/edit dialogs.
- Read/List Tests: verify `q` and `isActive` params; fee displays SAR from halalas.
- Create Tests: Arabic name only; English/both names and SAR fee.
- Update Tests: full update body; toggle active/inactive.
- Delete/Archive/Disable Tests: disable/archive safe active zone; verify no permanent-delete behavior.
- Validation Tests: missing name, invalid/negative fee.
- Network Verification: `GET/POST/PUT/DELETE /api/dashboard/zones`, `PATCH /:id/toggle`.
- Expected UI Checks: table/chart loading, no-zones empty, mutation toasts, action buttons reachable on mobile.

### Manual QA Script: /premium-meals
- Preconditions: admin/superadmin; linked premium upgrade, unlinked candidate, optional price mismatch diagnostic.
- Navigation: open `/premium-meals`, open candidate link/edit/archive dialogs.
- Read/List Tests: readiness, list, filters, candidate picker, empty/loading/error states.
- Create Tests: link candidate as premium upgrade.
- Update Tests: edit price delta/order/visibility; toggle state if exposed.
- Delete/Archive/Disable Tests: archive safe upgrade.
- Validation Tests: invalid price delta, missing candidate/source identity.
- Network Verification: `GET /readiness`, `GET /premium-upgrades`, `GET /candidates`, `POST /premium-upgrades`, `PATCH /:id`, `PATCH /:id/state`, `POST /:id/archive`.
- Expected UI Checks: readiness/table loaders, mutation toasts, premium query invalidation, mobile dialogs/cards.

### Manual QA Script: /pickup-branches
- Preconditions: admin/superadmin; active/inactive pickup branches; endpoint contract confirmation.
- Navigation: open `/pickup-branches`, exercise visible branch actions.
- Read/List Tests: list/cards, empty and error states.
- Create Tests: create safe branch if supported.
- Update Tests: edit name/address/status if supported.
- Delete/Archive/Disable Tests: disable/archive safe branch only.
- Validation Tests: missing name/address, invalid location/contact.
- Network Verification: endpoint/method TBD by backend contract; payload branch fields.
- Expected UI Checks: loading, empty, error, success toast, list update, mobile controls, RTL copy.

### Manual QA Script: /payments
- Preconditions: admin/superadmin/cashier; pending, paid, failed, refund/partial fixtures if supported.
- Navigation: open `/payments`, open detail and breakdown.
- Read/List Tests: list/filter/paginate, detail, amount breakdown.
- Create Tests: not supported.
- Update Tests: verify safe pending payment.
- Delete/Archive/Disable Tests: not supported unless refund/cancel exists.
- Validation Tests: invalid payment id/action, backend rejection of invalid verify.
- Network Verification: `GET /api/dashboard/payments`, `GET /:id`, `GET /:id/breakdown`, `POST /:id/verify`.
- Expected UI Checks: table/detail loading, no-payments empty, verify toast, list/detail update, amount/date clarity.

### Manual QA Script: /packages
- Preconditions: admin/superadmin; active/inactive plans, grams/meal tiers.
- Navigation: open `/packages`, open create/edit/tier controls.
- Read/List Tests: packages list, status, tier display.
- Create Tests: create safe draft/test plan; add grams/meals if supported.
- Update Tests: edit plan, toggle active/inactive, update tiers.
- Delete/Archive/Disable Tests: prefer inactive toggle; archive only safe fixture.
- Validation Tests: missing name/price/duration, invalid grams/meals/policies.
- Network Verification: `GET/POST/PUT /api/dashboard/plans`, `PATCH /:id/toggle`, tier `POST` endpoints.
- Expected UI Checks: list/form loading, no-plans empty, mutation toasts, packages invalidation, complex form mobile usability.

### Manual QA Script: /operations
- Preconditions: admin/superadmin/kitchen/courier; kitchen, pickup, courier, one-time order, and subscription-day queue items.
- Navigation: open `/operations` as each role, switch tabs/details/search.
- Read/List Tests: role-visible screens, queue table, kitchen/pickup/courier boards, charts.
- Create Tests: not supported.
- Update Tests: execute each backend allowed action on safe fixtures.
- Delete/Archive/Disable Tests: cancel/no-show only when backend `allowedActions` includes it.
- Validation Tests: required reason, empty/unknown chart data, responsive details dialog.
- Network Verification: `GET /api/dashboard/ops/list`, `GET /api/dashboard/ops/search`, action endpoint/method from `allowedActions` or `POST /api/dashboard/ops/actions/:action`.
- Expected UI Checks: board skeleton, per-board empty state, action toasts, queue invalidation, no duplicate actions.

### Manual QA Script: /one-time-orders
- Preconditions: admin/superadmin/kitchen/cashier; pending, kitchen, ready pickup, delivered/cancelled one-time orders.
- Navigation: open `/one-time-orders`, open detail route for each state.
- Read/List Tests: list/filter/paginate, detail, timeline.
- Create Tests: not supported unless UI exposes order creation.
- Update Tests: prepare, ready_for_pickup, fulfill.
- Delete/Archive/Disable Tests: cancel safe order with reason.
- Validation Tests: required cancel reason, invalid pickup code if applicable.
- Network Verification: `GET /api/dashboard/orders`, `GET /:orderId`, `GET /:orderId/timeline`, `POST /:orderId/actions/:action`.
- Expected UI Checks: list/detail loaders, no-orders empty, action toasts, list/detail invalidation, mobile customer/order fields visible.

### Manual QA Script: /notifications
- Preconditions: admin/superadmin; notification logs and summary counts.
- Navigation: open `/notifications`, filter/search logs if controls exist.
- Read/List Tests: summary and logs; empty logs state.
- Create Tests: not supported unless send controls exist.
- Update Tests: not supported unless mark-read exists.
- Delete/Archive/Disable Tests: not supported.
- Validation Tests: 401/500 and empty logs.
- Network Verification: `GET /api/dashboard/notifications/summary`, `GET /api/dashboard/notification-logs`.
- Expected UI Checks: summary/log loaders, no-logs empty, query errors, mobile logs readable.

### Manual QA Script: /menu
- Preconditions: admin/superadmin; categories, products, options, groups, customizable and non-customizable products.
- Navigation: open `/menu`, visit every tab and nested create/update route.
- Read/List Tests: lists, preview/builder tabs, search/filter/pagination, empty states.
- Create Tests: category/product/option/group; product-specific group/option links.
- Update Tests: edit entities, toggle availability/visibility/customization, reorder/duplicate/publish if exposed.
- Delete/Archive/Disable Tests: safe test entities only; verify product-specific links do not mutate global library data.
- Validation Tests: missing names/prices/relations; non-customizable controls hidden.
- Network Verification: `/api/dashboard/menu/*` `GET/POST/PATCH/DELETE`, visibility/availability endpoints, composer `GET ?contractVersion=v4`.
- Expected UI Checks: tab/table loaders, per-tab empty, mutation toasts, query invalidation, mobile tabs/forms.

### Manual QA Script: /manual-deduction
- Preconditions: admin/superadmin; phone with active subscription and regular/premium/add-on balances, insufficient balance case.
- Navigation: open `/manual-deduction`, search by test phone.
- Read/List Tests: subscription picker/balances and history.
- Create Tests: regular-only deduction and combined deduction if UI supports.
- Update Tests: backend returns updated balances; frontend must not trust stale local balance.
- Delete/Archive/Disable Tests: not supported.
- Validation Tests: empty submission blocked, insufficient balance from backend.
- Network Verification: `GET /api/dashboard/subscriptions/search`, `GET /:id/manual-deductions`, `POST /:id/manual-deduction`.
- Expected UI Checks: search/history loaders, no match/no history, deduction toast, subscription/search/history invalidation.

### Manual QA Script: /delivery
- Preconditions: admin/superadmin/courier; assigned delivery, out-for-delivery delivery, one-time delivery order; endpoint ownership decision.
- Navigation: open `/delivery` as admin and courier, filter/reset, open every card/action.
- Read/List Tests: merged deliveries/orders, customer/phone/address/window/status visible on mobile.
- Create Tests: not supported.
- Update Tests: collect, arriving-soon, delivered, cancel with reason.
- Delete/Archive/Disable Tests: cancel only if allowed.
- Validation Tests: required reason for cancel, missing address/status hidden gracefully.
- Network Verification: `GET /api/courier/deliveries/today`, `GET /api/courier/orders/today`, `PUT /api/courier/orders/:id/:action`, `PUT /api/courier/deliveries/:id/:action`.
- Expected UI Checks: cards/charts loaders, no-deliveries empty, endpoint/auth errors, action toasts, courier-critical mobile fields.

### Manual QA Script: /dashboard-users
- Preconditions: admin/superadmin; safe staff user accounts.
- Navigation: open `/dashboard-users`, create/edit/reset/delete safe non-production staff users.
- Read/List Tests: list/paginate/search if exposed, roles/statuses.
- Create Tests: create restricted dashboard user.
- Update Tests: change role/status/name; reset password.
- Delete/Archive/Disable Tests: delete/disable safe staff user only; verify self-delete/critical admin protection.
- Validation Tests: invalid role/password, backend permission errors.
- Network Verification: `GET/POST/PUT/DELETE /api/dashboard/dashboard-users`, `POST /:id/reset-password`.
- Expected UI Checks: list/form loading, no-staff empty, permission/API errors, mutation toasts, staff query invalidation.

### Manual QA Script: /addons
- Preconditions: admin/superadmin; add-on products, plan picker, active/inactive add-ons.
- Navigation: open `/addons`, create/edit/toggle/archive safe add-on.
- Read/List Tests: add-ons list, linked products/plans/prices.
- Create Tests: create safe add-on and prices if supported.
- Update Tests: edit add-on; toggle active/inactive.
- Delete/Archive/Disable Tests: archive/delete safe add-on, confirm wording and backend semantics.
- Validation Tests: missing name/price/product, invalid quantity/price.
- Network Verification: `GET/POST/PUT/DELETE /api/dashboard/addons`, `PATCH /:id/toggle`.
- Expected UI Checks: table/form loading, no-addons empty, mutation toasts, addons invalidation, mobile dialog fit.

### Manual QA Script: /accounting
- Preconditions: admin/superadmin; daily report rows, payments, delivery/order data.
- Navigation: open `/accounting`, change date/filter and export.
- Read/List Tests: daily report and totals against fixture.
- Create Tests: not supported.
- Update Tests: not supported except refresh.
- Delete/Archive/Disable Tests: not supported.
- Validation Tests: invalid/empty date, 500/export failure.
- Network Verification: `GET /api/dashboard/accounting/daily-report`, `GET /api/dashboard/accounting/daily-report/export`.
- Expected UI Checks: report loader, no-finance empty, report/export error, manual refetch stable, mobile totals readable.

## Static API Contract Audit

| Screen | File | Function/Hook | Method | Endpoint | Params | Payload | Response Mapping | Risk | Runtime Retest Needed? |
|---|---|---|---|---|---|---|---|---|---|
| Auth | src/lib/authApi.ts | login/getSession/logout | POST/GET/POST | /api/dashboard/auth/login, /me, /logout | none | credentials for login | normalizeAuthResponse reads top-level or data token/user | auth/me unauth returns 200 false envelope | Yes |
| Users | src/utils/fetchUsersData.ts | fetchUsers/fetchUser/createUser/updateUser | GET/POST/PUT | /api/dashboard/users, /:userId | page, limit, q | user form fields | returns response data | mutation payload needs runtime validation | Yes |
| Subscriptions | src/utils/fetchSubscriptionsData.ts | summary/list/detail/create/quote/actions | GET/POST/PUT/PATCH | /api/dashboard/subscriptions* | status, page, q, dates | subscription, delivery, balances, addons | mixed direct response mapping | high blast radius, backend-owned balances | Yes |
| Manual Deduction | src/utils/fetchSubscriptionsData.ts, src/utils/fetchDashboardOpsData.ts | search/manualDeduction/history | GET/POST | /api/dashboard/subscriptions/search, /:id/manual-deduction, /manual-deductions | phone, limit | regularMeals, premiumMeals, reason, notes | returns backend data | add-on atomic deduction support must be verified | Yes |
| Zones | src/utils/fetchDeliveryZonesData.ts | list/detail/create/update/delete/toggle | GET/POST/PUT/DELETE/PATCH | /api/dashboard/zones, /:id, /:id/toggle | q, isActive | name, deliveryFeeHalala, isActive, sortOrder | normalizes _id/id locally | DELETE used for archive wording | Yes |
| Promo Codes | src/utils/fetchPromoCodesData.ts | list/detail/create/update/delete/toggle/validate | GET/POST/PUT/DELETE/PATCH | /api/dashboard/promo-codes* | includeDeleted | PromoCodePayload, validation payload | flexible normalizers | DELETE used for archive; appliesTo runtime needed | Yes |
| Restaurant Hours | src/utils/fetchSettings.ts, src/routes/_protected/restaurant-hours/index.tsx | fetch/update restaurant hours | GET/PUT | /api/dashboard/settings/restaurant-hours | none | canonical restaurant_* fields, delivery_windows, restaurant_hours, temporary_closure | returns data or data.data | temporary_closure shape uses object {isActive}; confirm | Yes |
| Settings | src/routes/_protected/settings/index.tsx | route component | N/A | none | none | none | static cards | no API on mount by source | No for source; yes for runtime nav |
| Premium Upgrades | src/utils/fetchPremiumUpgrades.ts | readiness/list/candidates/create/update/state/archive | GET/POST/PATCH | /api/dashboard/premium-upgrades* | filters | candidate fields, upgradeDeltaHalala, state | typed normalizers | candidate identity and price units need runtime | Yes |
| Delivery | src/utils/fetchCourierDeliveries.ts | fetchCourierDeliveryList/executeCourierDeliveryAction | GET/PUT | /api/courier/deliveries/today, /api/courier/orders/today, /api/courier/... | date arg ignored by endpoint | reason/note on cancel | adapts courier DTO to UnifiedQueueItem | wrong endpoint family; frontend-created actions | Yes |
| Operations | src/utils/fetchDashboardOpsData.ts, src/hooks/useOperationsBoard.ts | fetchDashboardOpsList/Search/action | GET/POST/request | /api/dashboard/ops/list, /search, action.endpoint or /ops/actions/:action | date, q | entityId, entityType, source, action, reason/note/payload | extractOperationsQueueItems | source supports backend allowedActions; runtime action methods need test | Yes |
| One-Time Orders | src/utils/fetchOneTimeOrders.ts | list/detail/timeline/actions | GET/POST | /api/dashboard/orders* | filters/orderId | reason, notes, pickupCode | typed/adapted order data | action availability must come from backend | Yes |
| Payments | src/utils/fetchPaymentsData.ts | list/detail/breakdown/verify | GET/POST | /api/dashboard/payments* | filters/id | verify id | response data | verify side effects need safe pending payment | Yes |
| Packages | src/utils/fetchGetPackagesData.ts, fetchCreatePackage.ts, fetchUpdatePackage.ts, fetchPackageTiers.ts | list/create/update/toggle/tiers | GET/POST/PUT/PATCH | /api/dashboard/plans* | view/filters | plan/tier payloads | response data | money/unit and tier semantics need runtime | Yes |
| Add-ons | src/utils/fetchAddons.ts, fetchCreateAddon.ts, fetchUpdateAddon.ts, fetchDeleteAddon.ts | list/create/update/delete/toggle | GET/POST/PUT/DELETE/PATCH | /api/dashboard/addons* | picker/view endpoints | add-on payload | response data | DELETE/archive semantics and price units need runtime | Yes |
| Menu | src/utils/fetchMenu*.ts, src/hooks/menu/* | categories/products/options/groups/builder/relations/actions | GET/POST/PATCH/DELETE | /api/dashboard/menu/* | filters, contractVersion | entity/relation/reorder/publish payloads | normalizers per entity | product-specific relation safety, delete/archive semantics | Yes |
| Dashboard Users | src/utils/fetchDashboardUsers.ts | list/create/detail/update/delete/reset | GET/POST/PUT/DELETE/POST | /api/dashboard/dashboard-users* | page, limit | staff user/reset fields | typed responses | role/permission and self-delete rules need runtime | Yes |
| Notifications | src/utils/dashboardApiContract.ts, routes/_protected/notifications/index.tsx | summary/logs | GET | /api/dashboard/notifications/summary, /notification-logs | limit, filters | none | query data | log filters/runtime errors unverified | Yes |
| Accounting | src/utils/dashboardApiContract.ts, hooks/useDashboardAdminQuery.ts | daily report/export | GET | /api/dashboard/accounting/daily-report, /export | date/filter params | none | query data/file | export response handling must be tested | Yes |

## P1 Source Reviews

### QA-003 Source Review
- Files: `src/utils/fetchCourierDeliveries.ts`, `src/hooks/useCourierDeliveriesQuery.ts`, `src/routes/_protected/delivery/index.tsx`, `src/components/pages/delivery/*`.
- Current endpoints: `GET /api/courier/deliveries/today`, `GET /api/courier/orders/today`, `PUT /api/courier/orders/:id/:endpointAction`, `PUT /api/courier/deliveries/:id/:endpointAction`.
- Risk: `/delivery` is a protected dashboard route available to admin/superadmin/courier, but the data/mutation family is courier-app scoped. It is unknown whether dashboard Bearer tokens are accepted by courier endpoints or whether courier endpoint permissions expose the right admin/courier behavior.
- Frontend change needed: Do not change endpoint ownership by guessing. If backend confirms dashboard must own this screen, replace with `/api/dashboard/...` delivery/ops endpoints and remove courier DTO adaptation.
- Backend decision needed: Confirm whether dashboard users should call `/api/courier/...`; if yes, document token compatibility and response contract. If no, provide dashboard-owned delivery list/action endpoints.
- Runtime retest needed: Yes. Test `/delivery` as admin, superadmin, and courier with assigned/out-for-delivery fixtures and inspect all requests.

### QA-004 Source Review
- Files: `src/utils/fetchCourierDeliveries.ts`, `src/components/pages/delivery/DeliveryCard.tsx`, `src/components/pages/delivery/DeliveryDashboardCards.tsx`, `src/hooks/useOperationsBoard.ts`, `src/lib/operationsBoard.ts`.
- Current action source: Courier delivery actions are synthesized in `courierActionsFor()` from booleans `canCourierPickup`, `canMarkArrivingSoon`, `canMarkDelivered`, and `canCancel`, then mapped into `allowedActions`. Operations board source uses backend `item.allowedActions` and action endpoint/method when available.
- Risk: The QA rule says actions must come from backend `allowedActions`. The delivery screen currently creates labels, colors, ids, and requiresReason locally from boolean flags. If backend workflow changes, UI may expose stale or invalid actions.
- Frontend change needed: Prefer canonical backend `allowedActions` for delivery. If booleans are the official contract, rename/document adapter as contract mapping and add tests.
- Backend decision needed: Decide whether courier list responses must include `allowedActions` objects with endpoint/method/label/requiresReason.
- Runtime retest needed: Yes. Verify no duplicate actions, no unavailable action appears, and failed action responses are shown.

### QA-005 Source Review
- Files: `src/utils/fetchPromoCodesData.ts`, `src/hooks/usePromoCodesQuery.ts`, `src/components/pages/promo-codes/PromoCodesTable.tsx`, `src/components/pages/promo-codes/promo-codes-columns.tsx`.
- Current endpoint: Archive action calls `DELETE /api/dashboard/promo-codes/:id`; list supports `includeDeleted`.
- UI wording: Arabic UI says archive/disable, e.g. "هل تريد أرشفة كود الخصم؟" and "سيتم أرشفة كود الخصم وتعطيله".
- Risk: UI promises soft archive, but HTTP method/function name is delete. If backend hard-deletes, this is a P1 data-loss risk. If backend soft-deletes, contract should be documented and function names should avoid implying permanent delete.
- Backend decision needed: Confirm DELETE is soft archive and returns archived/deleted state, or provide explicit `POST/PATCH /archive`.
- Runtime retest needed: Yes. Archive safe unused code, reload with/without includeDeleted, and verify record is disabled/archived not destroyed.

### QA-006 Source Review
- Files: `src/utils/fetchDeliveryZonesData.ts`, `src/hooks/useDeliveryZonesQuery.ts`, `src/components/pages/zones/ZonesTable.tsx`, `src/components/pages/zones/ZoneFormDialog.tsx`.
- Current endpoint: Archive/disable action calls `DELETE /api/dashboard/zones/:id`; toggle calls `PATCH /api/dashboard/zones/:id/toggle`; list filter sends `isActive`.
- UI wording: Arabic UI says disable, not permanent delete, e.g. "سيتم تعطيل المنطقة ولن تُحذف نهائياً".
- Risk: UI promises non-permanent disable, but source calls DELETE. If backend hard-deletes the zone, delivery setup and historical records may be corrupted. If soft-delete, contract should be explicit.
- Backend decision needed: Confirm DELETE soft-disables zones and how it interacts with `isActive` filter, or provide explicit disable/archive endpoint.
- Runtime retest needed: Yes. Disable active safe zone, verify it no longer appears in active filter, appears in inactive/all if supported, and historical references survive.

## Authenticated QA Data Requirements

| Area | Required Data | Why Needed | Example Safe Record | Required Role |
|---|---|---|---|---|
| Auth | admin user | Full dashboard coverage | qa.admin@example.test | admin/superadmin |
| Auth | courier user | Delivery and courier-restricted route coverage | qa.courier@example.test | courier |
| Auth | kitchen/operator user | Operations kitchen/pickup role coverage | qa.kitchen@example.test | kitchen |
| Auth | restricted user | Permission/redirect testing | qa.cashier@example.test | cashier |
| Customers | customer with no subscriptions | User empty detail and create subscription | QA NoSub +966500000001 | admin/cashier |
| Customers | customer with active subscription | Detail, manual deduction, lifecycle | QA ActiveSub +966500000002 | admin/cashier |
| Subscriptions | customer with premium meals | Premium balance/deduction/UI | active sub with premium upgrades | admin |
| Subscriptions | customer with add-on balance | Add-on deduction entitlement tests | active sub with add-on balance | admin |
| Orders | one-time order pending | Order prepare/cancel workflow | QA order pending | admin/kitchen |
| Orders | one-time order in kitchen | Kitchen board workflow | QA order preparing | kitchen |
| Orders | one-time order ready for pickup | Pickup fulfillment/no-show | QA order ready pickup | kitchen/admin |
| Delivery | delivery order assigned | Courier collect/dispatch | QA delivery assigned | courier/admin |
| Delivery | delivery order out for delivery | Arriving/delivered/cancel | QA delivery out | courier/admin |
| Zones | inactive zone | Filters/toggle inactive to active | QA Inactive Zone | admin |
| Zones | active zone | Update/toggle/archive | QA Active Zone | admin |
| Promo Codes | unused promo code | create/edit/archive/validate | QA_UNUSED_10 | admin |
| Promo Codes | promo code already used | duplicate/use-limit validation | QA_USED_ONCE | admin |
| Menu | customizable product | Product relation/customization tests | QA Custom Bowl | admin |
| Menu | non-customizable product | Ensure controls hidden | QA Fixed Meal | admin |
| Premium | premium upgrade linked | Edit/archive linked upgrade | QA Premium Chicken linked | admin |
| Premium | unlinked candidate | Candidate picker/link flow | QA Premium Steak candidate | admin |
| Payments | pending payment | verify action | QA pending SAR payment | admin/cashier |
| Accounting | daily report rows | report/export totals | QA report date with rows | admin |
| Dashboard Users | safe staff user | update/delete/reset | qa.staff@example.test | admin/superadmin |

## Runtime QA Checklist To Execute After Backend Provides Credentials

| Route | Action | Required Data | Required Role | Expected API | Status |
|---|---|---|---|---|---|
| / | login/logout/session | admin/courier/kitchen/cashier credentials | public + each role | /api/dashboard/auth/login, /me, /logout | Pending Backend Credentials/Data |
| /dashboard | load summary/charts/activity | dashboard report rows | admin/cashier | dashboard report/support endpoints | Pending Backend Credentials/Data |
| /users | list/search/paginate | multiple customers | admin/cashier | GET /api/dashboard/users | Pending Backend Credentials/Data |
| /users/create | create customer | unused phone/email | admin/cashier | POST /api/dashboard/users | Pending Backend Credentials/Data |
| /users/$userId | detail/subscriptions | valid user IDs | admin/cashier | GET /api/dashboard/users/:id, /subscriptions | Pending Backend Credentials/Data |
| /subscriptions | list/filter/search | subscriptions in multiple states | admin/cashier | GET /api/dashboard/subscriptions | Pending Backend Credentials/Data |
| /subscriptions/create | quote/create | customer, plan, zone, addons/premium | admin/cashier | POST /quote, POST /subscriptions | Pending Backend Credentials/Data |
| /subscriptions/$subscriptionId | freeze/unfreeze/extend/cancel/skip/update balances | active test subscription | admin/cashier | /api/dashboard/subscriptions/:id/* | Pending Backend Credentials/Data |
| /settings | verify no API/navigation cards | none | admin | none on mount | Pending Backend Credentials/Data |
| /restaurant-hours | load/save settings | test settings | admin | GET/PUT /api/dashboard/settings/restaurant-hours | Pending Backend Credentials/Data |
| /promo-codes | list/create/edit/toggle/archive/validate | unused/used promo codes | admin | /api/dashboard/promo-codes* | Pending Backend Credentials/Data |
| /zones | list/create/edit/toggle/archive | active/inactive zones | admin | /api/dashboard/zones* | Pending Backend Credentials/Data |
| /premium-meals | readiness/list/candidate link/edit/archive | linked/unlinked premium data | admin | /api/dashboard/premium-upgrades* | Pending Backend Credentials/Data |
| /pickup-branches | list/manage branches | active/inactive branches | admin | TBD branch endpoint | Pending Backend Credentials/Data |
| /payments | list/detail/breakdown/verify | pending/paid payments | admin/cashier | /api/dashboard/payments* | Pending Backend Credentials/Data |
| /packages | list/create/edit/toggle/tiers | safe plan/tier fixtures | admin | /api/dashboard/plans* | Pending Backend Credentials/Data |
| /operations | role boards/search/details/actions | kitchen/pickup/courier queue items | admin/kitchen/courier | /api/dashboard/ops/list, /ops/actions | Pending Backend Credentials/Data |
| /one-time-orders | list/detail/actions/cancel | one-time orders in each state | admin/kitchen/cashier | /api/dashboard/orders* | Pending Backend Credentials/Data |
| /notifications | summary/logs/filter | notification logs | admin | /api/dashboard/notifications/summary, /notification-logs | Pending Backend Credentials/Data |
| /menu | CRUD/toggles/relations/builder/preview | menu fixtures | admin | /api/dashboard/menu/* | Pending Backend Credentials/Data |
| /manual-deduction | search/deduct/history | subscriptions with balances | admin | /api/dashboard/subscriptions/search, /manual-deduction | Pending Backend Credentials/Data |
| /delivery | list/filter/actions/mobile | assigned/out-for-delivery fixtures | admin/courier | /api/courier/* or decided dashboard endpoint | Pending Backend Credentials/Data |
| /dashboard-users | list/create/update/delete/reset | safe staff accounts | admin/superadmin | /api/dashboard/dashboard-users* | Pending Backend Credentials/Data |
| /addons | list/create/update/toggle/archive | add-on fixtures | admin | /api/dashboard/addons* | Pending Backend Credentials/Data |
| /accounting | load/export report | daily report rows | admin | /api/dashboard/accounting/daily-report* | Pending Backend Credentials/Data |

## Safe Fixes Applied During Pre-Auth QA

| Issue | File | Change | Why Safe |
|---|---|---|---|
| None | None | No frontend fixes applied. | Known P1 items require backend contract confirmation and authenticated runtime retest. |

## Pre-Auth QA Continuation Summary

### Completed
- Route/action matrix: Added route-by-route action matrix with source-derived endpoints, methods, payload expectations, and blocked/runtime statuses.
- Manual QA scripts: Added scripts for all required major screens, including preconditions, steps, network checks, and UI checks.
- Static API audit: Added API helper/hook contract table with source-level risks.
- P1 source reviews: Expanded QA-003, QA-004, QA-005, and QA-006 with exact files, current endpoints/action sources, risks, and decisions needed.
- Authenticated QA data requirements: Added precise backend/test-data checklist for roles, customers, orders, zones, promos, menu, premium, payments, accounting, and staff users.
- Runtime checklist prepared: Added pending runtime checklist for all major routes.

### Still Blocked
- Authenticated navigation: blocked until valid dashboard credentials/tokens exist.
- Authenticated CRUD: blocked until safe seed data exists.
- Runtime mutation payload verification: blocked until auth, records, and backend contracts are available.
- Mobile authenticated UI: blocked until protected screens can load with data.
- Dark/light authenticated UI: blocked until protected screens can load with data.

### Next Required From Backend
- Credentials: admin/superadmin, courier, kitchen, cashier/restricted test accounts.
- Seed data: safe customers, subscriptions, orders, deliveries, zones, promo codes, menu entities, premium upgrades, payments, accounting rows, and staff users.
- Contract decisions: delivery endpoint ownership, courier allowedActions contract, promo archive DELETE semantics, zone archive DELETE semantics, pickup-branches endpoint ownership.

### Can Refactor Start?
No. Refactor can only start after authenticated runtime QA is completed and P0/P1 issues are fixed or accepted with reason.
