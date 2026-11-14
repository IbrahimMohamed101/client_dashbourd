# Basic Diet POS — PRD v0.3.2 Implementation Matrix (2026-11-05)

Scope: STAGING ONLY. Never enable financial production writes until readiness gates pass. This is a historical progress ledger; the **current owner-approved rules are in [Stage F decisions](./STAGE_F_FINANCIAL_DECISIONS_DRAFT.md) and [consolidated PRD v0.3.3](./PRD_v0.3.3_STAGING_UNIFIED.md)**. Older “blocked/pending/unapproved” paragraphs below describe snapshots before Stage F and must **not** supersede D-088..D-090.

## Stage F final implementation status — 2026-11-07

- **Backend:** [PR #198](https://github.com/IbrahimMohamed101/basicdiet145/pull/198) merged into `codex/pos-staging-isolation`, commit `3e68e0b`. Railway Staging backend deployment `0c71e6f2-1df3-4ccb-b23f-74e51f89d201` reported `SUCCESS`; startup log shows the private `basicdiet_pos_staging_test` DB on `mongodb-qxhu.railway.internal:27017`.
- **Dashboard:** [PR #89](https://github.com/IbrahimMohamed101/client_dashbourd/pull/89) merged into `codex/pos-staging-preview`, commit `6ba94f7`. Railway dashboard Staging deploy `da7c5cac-e521-4b88-a275-6297779a819b` reported `SUCCESS`.
- **QA:** Backend 4/4 green GitHub workflows including 7 VAT test vectors, deterministic property test and MongoDB replica-set idempotency, concurrency and refunds. Dashboard 4/4 green PR checks, including synthetic four-viewport browser sale/return/receipt.
- **Delivered:** final VAT-inclusive server quote; halala HALF_UP; item, add-on and invoice discounts; 1–10 identical-add-on repetitions; atomic immutable invoice with unique idempotency key and separate ledger for restaurant cash/network vs app receivables; printed **non-tax Staging** receipt; recent invoices; capability-gated full/partial refunds with mandatory reason, externally recorded method, and pro-rata tax.
- **Temporary permission overrides:** D-089 removes the old cashier discount cap. D-090 grants `pos.refund` to cashier, restaurant, admin and superadmin; money is returned outside the POS.
- **Audit follow-up:** #85 server-trusted `publishedBy` and revision hash audit, #86 add-on repetitions. UI readback and tests tracked in dedicated Staging-only follow-up PRs.
- **Not yet certified:** #84 Railway `checkSuites=false` / Wait for CI cannot be enabled by the available connector; Staging commit pin mitigates future auto-deploys only. No live-Staging authenticated cashier end-to-end test or verified DB backup/restore. ZATCA Q-011 remains open before **any** Production sale.
- **Prohibitions still enforced:** No Production/`main`; no customer data; no terminal charge, Moyasar, real payment, ZATCA, or Production-grade fiscal invoice. Stage F must not be represented as a completed Production POS.

---

## Historical snapshots (pre-Stage-F; archived for traceability)



## Verified infrastructure evidence
- Railway Staging environment: `90700265-e775-4075-a99c-8d04508a7d98`
- Backend service `basicdiet145` deployed SUCCESS from `codex/pos-staging-isolation`, commit `30422d2062f0210b749fe28f286f95f96212b466`.
- Dashboard service `client_dashbourd` deployed SUCCESS from `codex/pos-staging-preview`, commit `deb85306f771e1494bfe8fa283fed0bcc243bc11`.
- Backend startup log: `basicdiet_pos_staging_test` via private `mongodb-qxhu.railway.internal:27017`, startup reports migrations/background jobs disabled; staging dashboard/API HTTP requests on distinct staging host.
- Staging private `MongoDB-qxhu`: `mongod --replSet rs0 --auth`, dedicated volume `15dbce68-2877-49a1-a0f4-9c4526bd13e4`, no public TCP proxies. Production MongoDB volume `43022175-0757-40b3-b7aa-6d7527586a59` is different.
- `src/utils/posStagingRuntime.js` requires exact Staging environment/service IDs, private Mongo host, fixed DB name, dedicated fixture accounts, disables payment credentials/OTP and paid-subscription feature flags.
- Staging logs show authorized POS catalog requests and permission denial for unauthorized manager actions. These are staging-only API requests, **not proof that the new UI PR itself passed E2E**.
- **Not fully verified**: MongoDB replica-set transaction health and index parity read from DB, a restorable tested backup, independent dynamic payment denial via deployed canary, outbound effects on every path, and certified ZATCA invoice contract.

## Status by PRD domain
| PRD requirements | Status as of 2026-11-05 | Evidence / next work |
|---|---|---|
| D-003..006 separate POS menu/prices | Staging implementation | New `PosCatalog`, no reuse of app menu prices; backed by `/api/dashboard/pos/catalog` |
| D-028..038 sizes/addons/channel pricing | Staging preview | Fixed three channels, category/product/variant/addon, independent amounts; dynamic manager-defined channel is pending |
| D-039 individual/bulk price editing | Draft PR implementation | `PosCatalogManager` with individual editing and channel-specific bulk table; not deployed / re-tested |
| D-040 draft/publish with previous versions | Partial | Draft+publish revision conflict exist; immutable previous published version history pending |
| D-041 changed price during open cart | Partial | Preview currently locks stale cart, does not present old/new and acceptance before payment |
| D-042..049 external orders and collections | UI preview partial | Channel toggle, optional external number, Paid/Cash selector (does NOT save). App cash receipts/settlement not yet implemented |
| D-050..055 restaurant checkout, print | Blocked | Preview cart only; no write endpoints, receipts, fiscal printing, or ZATCA compliance |
| D-056..059 manager-only refund | Not implemented | No financial refund/credit-note write; must be backed by audit, exactly-once keys and invoice references |
| D-060..065 manual discounts/cap | Not implemented | Server-calculated combined discount cap required |
| D-066..078 unified daily close | Not implemented | Existing `DailyCashClosing` uses draft/submitted/approved and conflicts with immutable close; ADR-001 unresolved |
| D-079..085 subscriptions integration | Not implemented in POS | Existing admin subscription create/quote and official meal deduction can be reused. Staff paid renewal endpoint missing. Never bypass user auth |
| G-01..G-10 safety gates | Partly evidenced | Staging isolation configured but production-ready sale remains blocked |
| Figma Design System | Blocked by Figma Starter tool limit | Blank file created: https://www.figma.com/design/Bf2Iaf0EzgGrjSHPHLpJ3y . Design tokens and local browser preview prepared separately |

## Explicitly excluded in v1
- No KDS, kitchen ticket, ERP, inventory management, split tender, or third-party app API integration.
- No duplicate POS subscription model and no POS menu edits to Flutter/app catalog.
- No new screen to reconcile delivery-platform payments as if they were local card charges. Capture external cash receipt later when specified.

## Verification before allowing sale writes
1. **Isolation**: prove private replica is actual Primary, live unique indexes, transactional rollback, denied cross-environment access, failed startup on unsafe configuration, and a successful backup restore.
2. **Pricing**: import approved current POS catalog with per-channel prices. Missing prices block sales; source catalog is not the app menu. Concurrent publish/price change tests.
3. **Sale**: backend-side quote/tax/discount, atomic safe-integer halalas, idempotent paid order commit and inventory-independent receipts; no duplicate under replay/concurrent requests.
4. **Refund**: manager authentication on server, full/partial linked credit note, external refund documentation and bounded over-refund.
5. **Subscriptions**: POS calls official services, staff paid-renewal flow uses official logic and role permissions, idempotency for meal deduction.
6. **Closing**: one final immutable close per business day, external app cash excluded until receipt; no double count of subscription payments.
7. **Compliance**: business tax profile, ZATCA requirements, printer configuration, invoice tests and accountant sign-off before live use.
8. **CI/E2E**: run full dashboard and backend suites + Chromium desktop/tablet/mobile on a disposable isolated Staging dataset, no production credentials or mutations.

## Staging UX phases — update 2026-11-07

- **A**: cashier full-screen workspace, responsive cart, category/search flow.
- **B**: cart editing, per-line quantity, safe session restoration and selected add-on feedback.
- **C**: searchable menu manager, draft vs published diff, per-channel prices, configurable default variant.
- **D (PR #82, preview implementation)**: all-channel price matrix, channel-to-channel bulk copy limited to searched rows (fill blanks or explicit overwrite; blank source never erases destination), copy product with new IDs and remapped default variant starting hidden, bulk allow/deny addons.
- **Verification for D**: isolated Vitest helper and manager tests plus extended four-viewport Chromium synthetic fixture. Test results must be read from PR #82 Actions before calling D accepted; use no production accounts.
- **D limitation**: copying prices does **not** activate sales. Zero price still requires confirmation when saving; drafts need explicit publish and use the same revision guard. Changing addon eligibility remains global per product, not automatically per channel; any per-channel rule would require a new PRD/backend contract.
- **E (PR pending, Staging only)**: invoice-before-payment review using the existing read-only backend `/api/dashboard/pos/quote`, strict response validation (matching revision/channel/line IDs/addons, safe halala arithmetic, no final payable), per-line preview, suggested restaurant cash/network tender and external-app reported paid/cash status. All sale/print/payment mutations remain disabled; provisional subtotal is not tax-inclusive payable amount.
- **E acceptance**: React/UI tests, quote-integrity unit tests, regression and four viewport QA. Do not display fiscal/tax invoice, print, record transactions, claim any cash collection or mark E financially complete.
- **Next operational dependencies**: full Staging isolation certification, backend final payable/tax/discount implementation, returns, subscriptions, closing and ZATCA remain blocked until their dedicated gates and permissions are satisfied.

## Phase E independent audit and Stage F decision gate — 2026-11-07

- **Stage E hardening**: clear stale checkout dialog intent (not merely hide it), keep action footer visible as order details scroll, distinguish proposed cash/network tender visually, and give RTL dialog close buttons Arabic accessible labels. Frontend tests and Chromium coverage required before Staging merge.
- **Stage F is NOT authorized for financial writes** by completion of a read-only Stage E screen. See [financial decision register](./STAGE_F_FINANCIAL_DECISIONS_DRAFT.md): owner/accounting sign-off needed on 15% VAT-inclusive price treatment, discount order and cap, line-vs-invoice rounding, sale idempotency, immutable invoice/refund authorization, ZATCA numbering and tested restore/isolation.
- **D-086 and D-087** are already recorded as separate approved Staging addenda in [CHG-023](./CHG-023_D-086_STAGING_AUTHORIZATION.md). They have not been merged into the original owner PRD; no editable original v0.3.2 PRD is present here. Do not suggest Production authorization.
- **Outstanding gates**: GitHub issue #84 (Railway Staging Wait for CI), #85 (`publishedBy` audit identity) and #86 (multiple quantity of same add-on); plus real cashier account permission checks.

## Engineering rules
- This PR targets `codex/pos-staging-preview`, not `main`.
- Keep `POS` purchase/refund mutations disabled until the above gates pass.
- New features are not marked complete merely because UI exists; server behavior and isolated E2E are required.
