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
