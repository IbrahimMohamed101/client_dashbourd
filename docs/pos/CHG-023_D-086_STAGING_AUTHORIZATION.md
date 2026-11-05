# Basic Diet POS — PRD v0.3.2 addendum (D-086 / CHG-023)

Date: 2026-11-05. Status: approved by owner through explicit instruction to implement the POS UI and backend and test on Staging.

## D-086 — Explicit limited authorization for POS Staging
Supersedes D-008 **only** for POS development, testing and deployments isolated to Staging. It does not authorize any Production changes or use of production customer data without de-identification and review.

- Dashboard code: IbrahimMohamed101/client_dashbourd, branch codex/pos-staging-preview.
- Backend code: IbrahimMohamed101/basicdiet145, branch codex/pos-staging-isolation.
- Dedicated Staging Mongo database: basicdiet_pos_staging_test.
- Production main, deployments, apps, payment gateways, source DB and customer records are out of scope.
- Real financial POS functionality remains disabled until accounting, security, role, idempotency and immutable-close tests pass.
- Production-derived test data must be sanitized: no personal names, addresses, phones, emails, tokens, payment identifiers, customer notes, or live order history; no credentials or payment records are copied.
- Original PRD v0.3.2 remains unchanged. Preserve this as an append-only decision when consolidating v0.3.3.

## CHG-023 — record of approvals
The owner authorized POS work in isolated Staging on 2026-11-05 and subsequently requested fixes and safe Production-derived test fixtures. The original D-008 study-only wording has therefore been superseded for Staging only.

## Acceptance conditions
1. Isolation guard and access-control tests run on every POS Staging pull request and push regardless of changed file paths.
2. Prices use immutable published catalog history and cannot be silently repriced.
3. Staging JWT secrets differ from Production and real provider credentials do not reach Staging.
4. Dataset has an allowlisted source inventory and anonymization process with zero live personal information.
5. No merge to main or Production deployment without a new explicit directive.
