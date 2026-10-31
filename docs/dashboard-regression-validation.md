# Dashboard regression repair validation

Scope: review-only repair branch based on `main` at `1de7b3ff9fb4240ef9382625f9f4c346c111b656`.

## Contracts and corrections

The baseline documented in [backend QA findings](https://github.com/IbrahimMohamed101/basicdiet145/blob/feat/dashboard-retention-live-read-model/reports/retention-final-qa/DASHBOARD_BASELINE_FINDINGS.md) had 44 failing assertions, an unregistered suite, and 32 ESLint errors / 10 warnings. No assertion was skipped, disabled, or marked expected to fail. ESLint configuration and rules are unchanged.

Checked against [backend PR #186](https://github.com/IbrahimMohamed101/basicdiet145/pull/186), commit `85f2207d31cd24211890d9a6689608027739a341`: subscription mode/payment validation in `adminController`, E.164 validation in `otpService`, authoring v1 catalog and family-specific picker routes, and courier read-only/action contracts.

- Supply explicit subscription modes in fixtures; retain stacking/deduction eligibility guards and unchanged quote/payment/promo calculations. Test current reset-password reason, response, asynchronous completion and secret-handling behavior.
- Use current QueryClient, catalog, menu-group, option and picker contracts in Meal Planner tests. Register the five existing `node:test` assertions with Vitest. Keep unavailable/foreign-family candidates disabled. Stop mutating backend-ineligible groups into eligible ones; reject explicitly incompatible/incomplete catalogs.
- Fix nine-digit Saudi mobile normalization, Arabic building search, and delivery fixture order references. Respect explicit empty/malformed action lists and read-only metadata; legacy fallback requires absent action field and explicit capability flags.
- Resolve hook lint errors through keyed dialog/filter state, derived selection and query-backed cancellable invoice requests. Preserve confirmation gates, refund/payment identity, subscription boundaries, draft amounts, and existing role restrictions. Other lint fixes are typed fields, stable memo inputs, component-only exports and redundant escape removal.
- Add regression guards for financial dialog resets/confirmation, non-superadmin financial access, closing draft hydration, invoice isolation/cache removal, and delivery action denials. All API writes in these guards are mocks with synthetic data.

## Validation

Node `20.20.2`, clean `npm ci` using the committed lockfile. Commands:

```sh
npm test
npm run lint -- --max-warnings 0
npm run typecheck
VITE_BACKEND_URL=http://127.0.0.1:3000 npm run build
```

Full tests: **370 passed, 0 failed, 0 skipped, 86 files**. This includes subscription creation/stacking/quotes/promos, financial control, menu authoring, delivery operations, staff roles and route permissions. Five previously unregistered assertions and ten added guard assertions explain the count increase from the baseline 355.

Full ESLint: **0 errors / 0 warnings**. TypeScript (`npm run typecheck` and build-mode `tsc -b`): **PASS**. Production build targeting loopback backend: **PASS**.

PR #62 compatibility: separate worktree validation pending.

`graphify update .` ran; it refused to replace the existing 4,133-node graph with a 2,711-node AST-only graph because previous chunk files are absent. Preserved the existing graph instead of forcing data loss. Build-generated route-tree churn is excluded from the repair.

No production requests, live customer writes, price changes, permission expansion, merges, deployment or manually dispatched workflows. Added an automatic pull-request-only Node 20 full-regression gate.
