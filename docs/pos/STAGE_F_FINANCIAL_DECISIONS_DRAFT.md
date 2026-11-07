# POS Stage F — financial-write entry criteria (DRAFT — NOT APPROVED)

Date: 2026-11-07. Environment: **dedicated Staging only**. This is a decision register, **not** authorization to implement or enable financial writes. The existing Stage E endpoint is a read-only quote; no checkout, fiscal invoice, tender settlement or real cash transaction is permitted.

## Decisions already constrained by the existing POS PRD/addenda

| ID | Constraint | Source / required enforcement |
| --- | --- | --- |
| F-01 | Only the server may calculate order prices. Ignore client totals; read the active **independent POS published catalog**, re-check revision before committing. | PRD D-041; Stage E quote contract; Stage D channel safeguards |
| F-02 | No silent checkout reprice. Display old/new and require affirmative action on a changed catalog; close any existing confirmation. | PRD D-041; Stage E audit, 2026-11-07 |
| F-03 | A sale must have a unique idempotency key and atomic transaction; duplicate/retry must not create a second invoice. | PRD D-018 |
| F-04 | A completed invoice is immutable; corrections are separately audited cancel/return/credit-note actions with role verification. | PRD D-022, D-056..059 |
| F-05 | Cashier/restaurant share operational menu permissions, **not** admin-level financial authorizations. | D-087 / CHG-023, `docs/pos/CHG-023_D-086_STAGING_AUTHORIZATION.md` |
| F-06 | Separate restaurant cash/network collections from app receivables and *externally reported* paid/cash statuses. No pseudo-cash added to drawer. | PRD D-042..050, D-068..070 |
| F-07 | No real fiscal invoice/print, live merchant charge, Production POS or automatic ZATCA transmission until independent sign-off and compliance. | D-086 / original readiness gates G-01..G-10 |

## Decisions still requiring explicit owner / accounting sign-off

| Decision | Current information | Acceptance required before implementation |
| --- | --- | --- |
| VAT basis (D-019, Q-027) | Reviewer states POS prices include **15% VAT**; discount is applied **before VAT**. This must be confirmed as an approved POS financial rule, including taxable vs non-taxable items. | Signed-off test vectors listing displayed gross price, discounts, taxable net, VAT and final payable in **halalas**. |
| Rounding (D-019, Q-027) | **Unresolved:** per-line versus invoice-level rounding and how to allocate any remainder. Stage D bulk-price **rounding upwards** is a separate catalog convenience rule; it does **not** decide tax rounding. | Written rule specifying rounding mode, level, and exact examples for multiple units, discounted lines, mixed taxable status and refunds. |
| Discount cap (D-060..065) | No authorized caps or role-specific discount amounts recorded in this ledger. | Manager vs cashier cap, item+invoice stacking, pre/post-tax treatment and server failure messages. |
| Elevated approval (D-057, D-087) | Cashier and restaurant are operationally equivalent. A specific approver role for cancel/refund/override remains unresolved. | Named permissions and stronger authorization path; audit immutable actor and manager. |
| ZATCA, numbers, tax profile (Q-011) | No confirmed compliant final invoice schema, numbering, signing/QR or printer setup. | Accountant and technical approval, region-specific requirements, distinct Staging test invoice namespace. |
| Reliable DB readiness | Dedicated Staging DB exists but full replica/transaction/index parity and backup restore tests were not signed off. | Live test of primary, transactions, unique indexes, rollback, restore, denied external access and no Production credentials. |
| Published-by and repeated add-ons | Issues #85 `publishedBy`, #86 `2×` add-on remain open. | Server-verified actor snapshot and additive quantity contract used by quote, sale and receipt. |
| CI deployment guard | Issue #84: Staging Railway `checkSuites: false`. | Enable **Wait for CI**, verify failing workflow blocks auto-deploy, and enforce branch protection or equivalent. |

## Required implementation acceptance tests for a future Stage F (no writes implemented here)

1. **Server price authority:** manipulate client prices, totals and VAT; backend ignores them or rejects invalid payloads; rejects changed published revision within the same transaction; does not mix old/new rates.
2. **Idempotency/concurrency:** same key + same payload returns the original persisted result; same key + different payload returns conflict; two cashiers and two concurrent calls cannot duplicate a sale; unknown network outcome is resolved via read-by-key without another sale.
3. **Disconnect-after-commit:** force response loss after a successful commit, then retry: **one** invoice, one collection, one closing entry. Force rollback before commit: none.
4. **Nonmodifiable invoices:** no PUT-style change to completed sale; full/partial refund requires server role authorization, immutable reference and capped remaining refundable amount.
5. **Accounting and separation:** no double count of app-paid orders, store cashier/operator identity, source channel, every item/variant/add-on, per-unit halalas, applied discounts, tax and catalog revision; daily closing remains separately signed off.
6. **Compliance:** numbering, test-only Staging marking, VAT test vectors, ZATCA and printer tests, accountant sign-off before any real sale.
7. **Isolation:** all tests on disposable, sanitized Staging DB; dashboard/backend CI plus Chromium desktop/tablet/mobile; Production and customer data never touched.

## Change control

- D-086 and D-087 are already authorized **as isolated addenda** in `docs/pos/CHG-023_D-086_STAGING_AUTHORIZATION.md`, not integrated into an original, editable PRD file in this repository. Incorporate them into the next owner-approved consolidated PRD without altering their scope or claiming Production permission.
- This document intentionally leaves accounting policy unresolved; **Stage F financial commit must remain disabled** until each blocker above has an explicit recorded decision and evidence.
