---
doc_version: 2.4
last_verified: 2026-05-26
scope: client_dashbourd
verification_method: source-read-and-local-release-checks
canonical: true
---

# Dashboard Release Readiness Report v2.4

## Status

Release gate status: Mostly ready.

Verified on 2026-05-26 in `client_dashbourd`:
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run build` passes

What changed in this verification pass:
- Removed duplicate frontend routes: `/orders` route deleted; one-time orders live only at `/one-time-orders` (nav label **الطلبات**).
- Accounting daily report sends required `date=YYYY-MM-DD` (KSA business date) via `src/utils/ksaDate.ts` and `resolveAccountingDailyReportParams()`.
- Added `toggleAddonItem()` for `PATCH /api/dashboard/addon-items/:id/toggle` in `src/utils/fetchUpdateAddon.ts`.
- Removed the duplicate copy problem by keeping this file as the canonical report.
- Fixed the only failing release-gate issue in `src/utils/fetchDashboardSupportData.ts`.
- Re-checked several items that the previous v2.2 report marked as missing.

## Confirmed Implemented

These items are present in the current frontend source:
- Kitchen route mismatch is fixed. `KITCHEN_ROUTES` only allows `/operations` and `/one-time-orders`.
- No duplicate orders UI: removed `src/routes/_protected/orders/`; RBAC and nav use `/one-time-orders` only.
- Centralized `403` handling exists in `src/lib/apis.ts`.
- Error parsing is broader than the previous report claimed. `src/lib/apiErrors.ts` reads top-level `message`, string/object `error`, `code`, `details`, and `expectedField`.
- Menu product duplicate helper exists in `src/utils/fetchMenuProducts.ts`.
- Menu versions and rollback helpers exist in `src/utils/fetchMenuActions.ts`.
- Menu versions UI exists in `src/components/pages/menu/versions/MenuVersionsTab.tsx`.
- Product and option forms expose `availableFor` and `availableForSubscription`.
- Option forms expose `displayCategoryKey`.
- Zone toggle helper exists in `src/utils/fetchDeliveryZonesData.ts`.
- Dashboard support helpers exist for:
  - search
  - notifications summary
  - today report
  - accounting daily report
  - accounting CSV export
  - subscription terms
  - dashboard logs
  - notification logs
  - health checks
- Dashboard staff user API helpers exist in `src/utils/fetchDashboardUsers.ts`.

## Still Not Fully Complete

The dashboard is not fully finished end-to-end yet. The main remaining gaps I verified are:
- There is no test script in `package.json`, so automated test coverage is still not part of the release gate.
- `src/routes/_protected/dashboard-users/index.tsx` is a scaffold page backed by real data, but it is not a full CRUD management screen yet.
- `src/routes/_protected/accounting/index.tsx` is also a scaffold page. It loads live data and exports CSV, but it is not a polished final reporting UI.
- The old v2.2 report claimed more missing items than are true today. It should not be used as the source of truth anymore.

## Practical Conclusion

If the goal is "can this frontend compile and pass local quality gates?", the answer is yes.

If the goal is "is every admin workflow fully finished and production-complete?", the answer is still no. The clearest unfinished areas I verified are the dashboard staff management UI and the accounting screen UX depth.

## Files Verified In This Pass

- `package.json`
- `src/constants/routes.ts`
- `src/lib/apiErrors.ts`
- `src/lib/apis.ts`
- `src/utils/fetchDashboardSupportData.ts`
- `src/utils/fetchDashboardUsers.ts`
- `src/utils/fetchMenuProducts.ts`
- `src/utils/fetchMenuActions.ts`
- `src/utils/fetchDeliveryZonesData.ts`
- `src/routes/_protected/dashboard-users/index.tsx`
- `src/routes/_protected/accounting/index.tsx`

## Commands Run

```bash
npm run lint
npm run typecheck
npm run build
```
