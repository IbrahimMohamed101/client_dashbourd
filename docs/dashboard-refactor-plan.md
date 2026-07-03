# Dashboard Refactor Plan

## 1. Current QA Status Summary

Baseline source: `docs/dashboard-final-qa-report.md`, accepted after the focused authenticated runtime retest on 2026-07-03.

Current status is ready to begin refactor planning with accepted known QA-data caveats. The dashboard has authenticated runtime coverage for the main protected route set, role access checks, focused delivery/pickup/dashboard-users retests, and successful `npm run typecheck`, `npm run lint`, and `npm run build` runs.

Verified frontend/runtime fixes:
- `/delivery`: the original canonical `allowedActions` versus legacy `can*` conflict is fixed for deployed non-actionable rows.
- `/pickup-branches`: settings-backed `pickup_locations` read, patch, edit, active/inactive toggle, persistence, and required-field UI validation are verified.
- `/dashboard-users`: React unique-key warning is fixed and verified.
- `/promo-codes`: unused promo soft archive and `includeDeleted=true` archived listing are verified.
- `/zones`: soft disable, inactive filter, restore toggle, and SAR/halala delivery fee conversion are verified.
- `/one-time-orders/:orderId`: localized object rendering crash is fixed and verified.

Open non-refactor items:
- QA-002 dependency audit remains a separate dependency-update track.
- QA-008 stale redirect-only route cleanup remains a separate small UX/routing cleanup.
- Formal full release signoff still depends on business acceptance of the QA-data caveats below.

## 2. Accepted Known QA-Data Caveats

These are accepted as QA-data caveats and must not be treated as frontend blockers during refactor:

| Issue | Area | Accepted Caveat | Frontend Implication |
|---|---|---|---|
| Issue #21 / QA-005 | `/promo-codes` | Deployed in-use promo seed rows `PMQAUSED10` and `PMQAUNUSED25` are missing, so `409 PROMO_IN_USE` archive verification remains blocked by QA data. | Do not change promo archive semantics to work around missing seed data. Keep `DELETE /api/dashboard/promo-codes/:id` as soft archive and keep `includeDeleted=true` support. |
| Issue #22 / RUNTIME-001 action execution gap | `/delivery` | Deployed actionable courier delivery/order row is missing, so action execution, toast, and refetch verification remain blocked by QA data. | Do not synthesize action buttons from `can*` flags. Keep rendering from canonical backend `allowedActions`; keep `/api/courier/*` endpoints. |

## 3. Refactor Goals

- Reduce dashboard frontend duplication without changing backend contracts or endpoint semantics.
- Improve typed API boundaries around existing response normalizers, query hooks, mutations, and UI payload builders.
- Make role-aware route behavior easier to reason about while preserving the current role matrix exactly.
- Isolate reusable table/dialog/form patterns where they already exist naturally, without rewriting every screen.
- Preserve runtime behavior for all verified screens and accepted caveats.
- Keep each refactor phase small enough to review, test, and roll back independently.

Non-goals:
- No backend contract changes.
- No endpoint migration.
- No large all-screen rewrite.
- No design-system replacement.
- No role-routing behavior changes.
- No change to `VITE_BACKEND_URL=https://basicdiet145.onrender.com`; do not add `/api` to the env base URL.

## 4. Files and Modules With Highest Risk

| Area | Files / Modules | Risk |
|---|---|---|
| API base/auth | `src/lib/apis.ts`, `src/lib/authApi.ts`, `src/lib/authMiddleware.ts`, `src/constants/routes.ts` | A small change can break every protected route, token handling, or role redirect. Preserve `baseURL: import.meta.env?.VITE_BACKEND_URL || ""` and API paths that already begin with `/api/...`. |
| Delivery actions | `src/utils/fetchCourierDeliveries.ts`, `src/hooks/useCourierDeliveriesQuery.ts`, `src/routes/_protected/delivery/index.tsx`, `src/components/pages/delivery/*` | Must keep canonical `allowedActions` rendering and `/api/courier/*` endpoints. Do not reintroduce frontend-synthesized action buttons or duplicate actions. |
| Operations queues | `src/lib/operationsBoard.ts`, `src/hooks/useOperationsBoard.ts`, `src/components/pages/operations-board/*`, `src/components/pages/kitchen-board/*`, `src/components/pages/pickup-board/*` | Shares action concepts with delivery and one-time orders; action availability must remain backend-driven. |
| Pickup branches/settings | `src/routes/_protected/pickup-branches/index.tsx`, `src/utils/fetchSettings.ts`, `src/hooks/useSettingsQuery.ts`, `src/types/settingsTypes.ts` | Must patch only `pickup_locations` for pickup branch edits and preserve all other settings fields. |
| Promo codes | `src/utils/fetchPromoCodesData.ts`, `src/hooks/usePromoCodesQuery.ts`, `src/components/pages/promo-codes/*`, `src/utils/promoCodeApiContract.ts` | Soft archive semantics and `includeDeleted=true` must remain unchanged. Missing in-use seed is not a frontend failure. |
| Zones | `src/utils/fetchDeliveryZonesData.ts`, `src/hooks/useDeliveryZonesQuery.ts`, `src/components/pages/zones/*`, `src/utils/deliveryZoneApiContract.ts` | `DELETE` is soft disable; inactive filter and restore toggle must keep working. |
| One-time orders | `src/routes/_protected/one-time-orders/*`, `src/components/pages/one-time-orders/*`, `src/lib/oneTimeOrderActions.ts`, `src/types/oneTimeOrderTypes.ts` | Localized `{ ar, en }` objects must never render directly as React children. |
| Menu | `src/routes/_protected/menu/*`, `src/components/pages/menu/*`, `src/hooks/menu/*`, menu payload mappers | Large surface area with many create/update relation routes; refactor only in narrow slices. |
| Generated routes | `src/routeTree.gen.ts` | Generated file should only change as a result of route changes. Avoid manual edits. |

## 5. Routes and Screens To Avoid Breaking

Preserve load, role access, redirects, empty/error states, dialogs, validation, toasts, query invalidation, mobile/tablet/desktop layout, RTL layout, and dark/light behavior for:

- `/dashboard`
- `/users`
- `/users/create`
- `/users/$userId`
- `/subscriptions`
- `/subscriptions/create`
- `/subscriptions/$subscriptionId`
- `/settings`
- `/restaurant-hours`
- `/promo-codes`
- `/zones`
- `/premium-meals`
- `/pickup-branches`
- `/payments`
- `/packages`
- `/operations`
- `/one-time-orders`
- `/one-time-orders/$orderId`
- `/notifications`
- `/menu`
- `/manual-deduction`
- `/delivery`
- `/dashboard-users`
- `/addons`
- `/accounting`

Keep redirect-only routes as-is unless a dedicated QA-008 cleanup is explicitly approved:

- `/packages/create`
- `/addons/create`
- `/addons/$addonId/update`

## 6. API Contracts That Must Not Change

Do not change these endpoint families, HTTP methods, payload meanings, or response assumptions during refactor:

| Area | Contract To Preserve |
|---|---|
| API base | `VITE_BACKEND_URL` is the host, for example `https://basicdiet145.onrender.com`; frontend paths already include `/api/...`. Never configure `https://basicdiet145.onrender.com/api` as the base. |
| Auth/session | `POST /api/dashboard/auth/login`, `GET /api/dashboard/auth/me`, `POST /api/dashboard/auth/logout`; unauthenticated `auth/me` may return a 200 logged-out envelope. |
| Role routing | `admin` and `superadmin` keep full dashboard access; `courier` keeps `/operations`, `/delivery`, `/profile`; `kitchen` keeps `/operations`, `/one-time-orders`, `/profile`; `cashier` keeps `/dashboard`, `/one-time-orders`, `/subscriptions`, `/payments`, `/users`, `/profile`. |
| Delivery | `/delivery` continues to use `GET /api/courier/deliveries/today`, `GET /api/courier/orders/today`, and backend-provided `allowedActions.endpoint`/method when present. `allowedActions` is canonical; `can*` flags are compatibility fallback only. |
| Pickup branches | `GET /api/dashboard/settings`; `PATCH /api/dashboard/settings` with only `pickup_locations` when editing pickup branches. Preserve other settings fields. |
| Promo codes | `GET/POST/PUT/DELETE /api/dashboard/promo-codes*`, `PATCH /api/dashboard/promo-codes/:id/toggle`, `POST /api/dashboard/promo-codes/validate`; `DELETE` remains soft archive. |
| Zones | `GET/POST/PUT/DELETE /api/dashboard/zones*`, `PATCH /api/dashboard/zones/:id/toggle`; `DELETE` remains soft disable, not hard delete. |
| Dashboard users | `GET/POST/PUT/DELETE /api/dashboard/dashboard-users*`, `POST /api/dashboard/dashboard-users/:id/reset-password`. |
| Operations | `/api/dashboard/ops/list`, `/api/dashboard/ops/actions/:action`, and related board/detail endpoints remain backend-action driven. |
| One-time orders | `/api/dashboard/orders*`; localized names may be `{ ar, en }` and must be normalized before rendering. |
| Settings/restaurant hours | `/api/dashboard/settings`, `/api/dashboard/settings/restaurant-hours`; preserve existing payload keys. |

## 7. Suggested Refactor Phases

### Phase 0 - Guardrails and Inventory

Scope:
- Add or update planning-only docs and checklists.
- Identify duplicated patterns and risky files.
- Do not change runtime code.

Exit criteria:
- Refactor plan committed.
- No runtime code changes.

Validation:
```bash
npm run typecheck
npm run lint
npm run build
```

### Phase 1 - Low-Risk Shared Utilities

Scope:
- Extract small pure helpers for localized text display, money/halala formatting, and stable entity keys only where repeated.
- Prefer colocated helper files near existing modules unless a helper is already shared.
- Do not touch endpoint strings or mutation behavior.

High-value candidates:
- Localized string normalization used by one-time orders, menu, zones, packages, pickup branches.
- Stable list key helper for fallback display keys.
- Small unit-format helpers already implied by SAR/halala conversions.

Validation:
```bash
npm run typecheck
npm run lint
npm run build
```

Manual QA after phase:
- Open `/one-time-orders/$orderId`, `/pickup-branches`, `/zones`, `/promo-codes`, `/packages`, and `/menu`.
- Confirm localized Arabic/English names render as strings.
- Confirm no React child/object render errors.
- Confirm no unique-key warnings on touched list/card screens.

### Phase 2 - API Contract Constants and Response Normalizers

Scope:
- Consolidate endpoint constants only where the repo already uses contract helper files.
- Keep endpoint values byte-for-byte equivalent.
- Tighten response normalizers around existing DTO shapes without changing UI behavior.

High-value candidates:
- `src/utils/fetchCourierDeliveries.ts`
- `src/utils/fetchPromoCodesData.ts`
- `src/utils/fetchDeliveryZonesData.ts`
- `src/utils/fetchSettings.ts`
- `src/utils/dashboardApiContract.ts`

Validation:
```bash
npm run typecheck
npm run lint
npm run build
```

Manual QA after phase:
- `/delivery`: load as admin/courier, verify no duplicate actions and no fallback `can*` buttons when canonical actions are empty.
- `/pickup-branches`: GET settings, save a safe branch edit with only `pickup_locations`.
- `/promo-codes`: list with and without archived toggle, create/edit/toggle/archive a safe unused promo if data allows.
- `/zones`: list active/inactive, create/edit/disable/restore a safe zone if data allows.

### Phase 3 - Query and Mutation Hook Cleanup

Scope:
- Normalize query keys and invalidation patterns where behavior is already verified.
- Keep mutation payloads, methods, and endpoints unchanged.
- Do not combine unrelated screen hooks in one large abstraction.

High-value candidates:
- `src/hooks/useCourierDeliveriesQuery.ts`
- `src/hooks/usePromoCodesQuery.ts`
- `src/hooks/useDeliveryZonesQuery.ts`
- `src/hooks/useSettingsQuery.ts`
- `src/hooks/useDashboardAdminQuery.ts`

Validation:
```bash
npm run typecheck
npm run lint
npm run build
```

Manual QA after phase:
- For every touched mutation, verify success toast, error toast, and query invalidation/refetch.
- Confirm `/delivery` still refetches after an action when actionable seed data exists; otherwise record Issue #22 caveat.
- Confirm `/pickup-branches` still preserves non-pickup settings.
- Confirm `/promo-codes` and `/zones` list state updates after toggle/archive/restore.

### Phase 4 - Component-Level Simplification, One Screen Family at a Time

Scope:
- Refactor only one screen family per PR/commit.
- Prefer extracting small presentational components from large files.
- Preserve UI text, validation messages, button behavior, and route ownership.

Recommended order:
1. `/dashboard-users` because recent fix is small and verified.
2. `/pickup-branches` because contract is now clear and single-route scoped.
3. `/zones` because archive/toggle contract is verified.
4. `/promo-codes` because archive behavior is verified but Issue #21 data caveat remains.
5. `/delivery` only after action-row seed exists or the action-execution caveat remains explicitly accepted.
6. `/menu`, `/operations`, and subscription detail flows last because they have the broadest contract surface.

Validation:
```bash
npm run typecheck
npm run lint
npm run build
```

Manual QA after phase:
- Load the touched route in desktop and mobile.
- Test loading, empty, error, validation, dialog open/close, success toast, error toast, and refetch behavior.
- Check browser console for React warnings and API errors.
- Check role access for the route if role-specific.

### Phase 5 - Route Cleanup Only After Explicit Approval

Scope:
- Address QA-008 redirect-only routes if product confirms they are stale or intentionally redirect-only.
- Do not delete route files until links, generated route tree, legacy components, and docs are reviewed.

Validation:
```bash
npm run typecheck
npm run lint
npm run build
```

Manual QA after phase:
- Directly open `/packages/create`, `/addons/create`, and `/addons/$addonId/update`.
- Confirm expected redirect-only behavior or newly approved replacement behavior.
- Confirm no nav/buttons link to removed routes.

### Phase 6 - Dependency Updates as a Separate Track

Scope:
- Address QA-002 in a dedicated dependency PR/commit.
- Prefer safe patch/minor updates first, especially auth/runtime-sensitive packages.
- Do not mix dependency updates with feature refactors.

Validation:
```bash
npm run typecheck
npm run lint
npm run build
npm audit
```

Manual QA after phase:
- Login/logout/session refresh.
- Auth redirects by role.
- File/image upload if `axios` or related request tooling changes.
- Dev server smoke if `vite` changes.

## 8. Validation Commands For Every Phase

Every refactor phase must pass:

```bash
npm run typecheck
npm run lint
npm run build
```

Additional recommended checks by phase:

| Phase | Extra Checks |
|---|---|
| Phase 1 | Browser console check on touched list/detail screens. |
| Phase 2 | Network inspection to confirm endpoint paths and methods did not change. |
| Phase 3 | Mutation refetch/invalidation check for each touched hook. |
| Phase 4 | Desktop/mobile route smoke for each touched screen. |
| Phase 5 | Direct navigation to redirect-only routes and generated route tree review. |
| Phase 6 | `npm audit` plus auth/session smoke. |

## 9. Rollback Strategy

- Keep every phase as a small, focused commit or PR.
- If a phase fails commands, do not proceed to manual QA; fix or revert that phase.
- If runtime QA fails, revert only the phase commit that introduced the failure.
- Do not revert unrelated worktree changes or generated artifacts from other tasks.
- Preserve `docs/dashboard-final-qa-report.md` as the baseline and append new findings rather than rewriting history.
- For API/path regressions, first compare touched endpoint constants and fetch utilities against the contract table in this plan.
- For role-routing regressions, compare `src/constants/routes.ts` and `src/lib/authMiddleware.ts` against the role matrix in this plan before touching screens.

## 10. Manual QA Checklist After Each Phase

Run this checklist for each touched screen family:

| Check | Required Result |
|---|---|
| Auth/session | Valid role can load the route; invalid role redirects to the same default route as before. |
| Page load | No crash, no unexpected login redirect, no infinite loading loop. |
| Loading state | Existing loaders/skeletons still render where present. |
| Empty state | Empty lists show the existing empty state and do not crash. |
| Error state | API failures show an existing error state or toast without redirect loops. |
| Create/update | Payload shape, method, endpoint, success toast, and query invalidation are unchanged. |
| Archive/delete/disable | Existing soft archive/soft disable semantics are preserved. |
| Toggle | Toggle endpoint and follow-up list state are unchanged. |
| Details | Detail routes render localized strings safely and do not render raw objects. |
| Filters/search/pagination | Query params and local filter behavior remain stable. |
| Dialogs | Dialog open/close, validation, disabled submit states, and mobile layout remain usable. |
| Toasts | Success and error toasts still appear for mutations. |
| React Query | Touched mutations invalidate/refetch the same data as before. |
| Responsive layout | Desktop, tablet, and mobile render without overlapping controls. |
| Theme/RTL | Dark/light and RTL layout remain coherent. |
| Console/network | No new React warnings, page errors, failed requests, or accidental `/api/api/...` URLs. |

Focused caveat handling during manual QA:
- If `/delivery` still lacks actionable deployed rows, record Issue #22 as `Blocked by Missing Data` and do not fail frontend unless the non-actionable rows expose duplicate actions or conflicting legacy flags.
- If promo in-use seeds are still missing, record Issue #21 as `Blocked by Missing Data` and do not fail frontend unless normal promo list/archive behavior regresses.
