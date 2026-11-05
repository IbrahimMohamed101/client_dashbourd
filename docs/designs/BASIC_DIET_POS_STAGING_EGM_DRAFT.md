# Basic Diet POS — EGM design draft (2026-11-05)

> Source: [Google Elephant–Goldfish Model](https://github.com/google/elephant-goldfish-model), [PRD v0.3.2](../pos/PRD_v0.3.2_IMPLEMENTATION_STATUS.md), user-provided `BasicDiet_POS_UI_Improved(1).html` (self-contained local prototype).
> Status: design baseline for **Staging only**; **not** a Goldfish-reviewed/approved release. Fresh zero-context agent reviews are unavailable in the current execution surface and must not be represented as done.

## Problem and boundaries
The POS presently has a cashier catalog/preview cart and an administrator-only independent catalog. The uploaded HTML demonstrates eight POS views (sale, overview, orders/invoices, subscriptions, close, channel prices, catalog, settings) but all financial operations are local JavaScript with demo data; copying those implementations would create false balances.

Goal: create a consistent native dashboard POS information architecture and interaction-ready UI for the agreed PRD before enabling any financial backend action. Do not copy the HTML's seeded orders, fixed dates, browser storage or pretend a payment happened.

## Design
1. Keep existing separate POS menu and pricing endpoints `/api/dashboard/pos/catalog`. Do **not** touch app menu resources or Flutter menu publication.
2. Native React routes remain within `/_protected/pos`, with reusable POS navigation in the dashboard. No second app, no iframe, no external fonts/images or localStorage financial records.
3. Explicitly separate **preview** states from **persisted** financial states. Show `—` and an empty state instead of invented sales totals.
4. Cashier sees preview sales, manually entered application order metadata, subscriptions form, close summary, and related navigation. Administrators additionally see menu/catalog editor. Server enforces manager-only writes.
5. Back-end after UI: implement server-calculated quote, atomic committed sale with idempotency key and printer contract, manager-only linked refunds, official subscription create/renew/meal deduction, one immutable consolidated daily close. Each backend mutation stays disabled until its own Staging safety test passes.
6. App-order Paid/Cash is a *state of an external platform order*, not a network payment on the restaurant terminal; app-cash not part of local drawer unless cash physically collected and recorded under policy.

## Risks / Goldfish challenges to verify independently
- The prototype's fictional transactions could be mistaken for live records.
- Current Staging isolation evidence is necessary but not sufficient: prove denied production DB access, backup/restore and transactional Mongo replica health.
- PRD's immutable one-per-day POS close may conflict with existing dashboard's approve/reopen close flow: require one canonical business-day state machine.
- Price changes during cart editing must require explicit acceptance; never silently charge revised prices.
- Renewal and meal deduction must call existing official entitlement services, not reimplement aggregateBalance.
- Full/partial returns require server-side authorization and traceable credit notes; a UI toast is not a refund.
- Fiscal invoice/receipt and ZATCA compliance need checked output and finance approval before production.

## Implementation order and files
- `src/features/pos/PosOperationsShell.tsx`: native responsive view-switching shell, empty/pending financial sections; real catalog derived from API, no financial fabrication.
- `src/features/pos/PosSalePage.tsx`: render shell after loading approved separate POS catalog.
- `src/features/pos/PosWorkspace.tsx`: product-first sales experience and non-financial checkout form.
- `src/features/pos/PosCatalogManager.tsx`: draft prices and independent catalog editing, manager-only.
- `src/features/pos/PosOperationsShell.test.tsx`: RTL/roles/tabs/preview safeguards.
- Backend to follow in separate PR and branch `codex/pos-staging-isolation` with dedicated models/handlers/tests.

## Acceptance gates
UI: valid TypeScript, lint, Vitest and Chromium desktop 1366/tablet 1024/mobile 390; RTL, keyboard/focus, screen-reader status; no financial records stored locally.
Backend: unique indexes, transactional commit/rollback, concurrent/replayed order tests, security role tests, finance calculations, database isolation + backup restore, zero production write path.
Release: Staging-only merge after CI success, live click tests and review. No Production auto-deploy and no enabling real cash/credit operations prior to safety gates.
