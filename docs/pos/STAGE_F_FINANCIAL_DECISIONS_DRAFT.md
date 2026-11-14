# POS Stage F — financial decisions (OWNER APPROVED)

Date: 2026-11-07. Owner explicitly approved **simulation-only sales, receipts and refunds in isolated Staging**. This replaces the previous unapproved Stage F draft; the filename remains for link continuity.

**Allowed:** `codex/pos-staging-preview` and `codex/pos-staging-isolation`, private `basicdiet_pos_staging_test` replica set, fake printed invoices, no real cash transfer. **Forbidden:** Production, `main`, application/customer menu changes, real charges, Moyasar, ZATCA, touching real customer or Production data.

## Approved decision register

| ID | Final owner decision | Implementation rule |
| --- | --- | --- |
| **D-018** | Approved on Stage F: atomic, idempotent sale | Required unique `Idempotency-Key` + canonical intent hash; MongoDB transaction; same intent returns one persisted invoice; altered intent 409 |
| **D-019 / D-088** | **Approved, superseding proposed D-019:** all prices VAT inclusive at 15%; discounts applied on **inclusive gross first** | `vatHalalas=floor((grossHalalas*30+115)/230)` per final line; net = gross − VAT; invoice totals = line sums; HALF_UP to halala; differs intentionally from Imdad pre-discount VAT |
| **D-022** | Approved on Stage F: no invoice mutation | No PUT/PATCH of issued invoices; correction by linked, separately numbered return |
| **D-041** | Reject publish/revision race | Re-read current published catalog inside sale transaction and reject stale revision before issue |
| **D-050** | One restaurant tender | Cash with received/change, or network record-only; external delivery app statuses `paid|cash` are **app receivables**, not cash drawer receipts |
| **D-056 / D-090** | Temporary permission override of former manager-only D-057 | Cashier, restaurant, admin and superadmin have separately revocable `pos.refund`; full/partial quantity returns with mandatory reason and manually recorded external refund method |
| **D-058** | External refund only | POS records accounting document; does not transfer funds or contact a gateway |
| **D-060 / D-089** | Temporary override of former cashier cap | No numeric cashier cap; fixed/percent discount on item/add-on/invoice, across channels. Never above gross; record trusted actor, type, value, time. Server config cap `null` means unlimited |
| **D-065** | Combined item + invoice discounts | First line discounts, then invoice discount; allocate by largest remainder (fraction descending, then higher post-line-discount amount, then earlier line order) |
| **D-068** | Separated collection sources | Cash/network restaurant ledger vs app receivable; never count app payment as local cash |
| **D-086** | Staging work authorization only | UI/backend implementation and synthetic workflows on independent Staging, no Production changes |
| **D-087** | Cashier and restaurant operational parity | No accidental superadmin privilege |
| **#85** | Snapshot publisher from server auth | Trusted staff profile in draft save/publish, immutable revision `publishedBy`, timestamp, source/destination revision and SHA-256 audit, visible in menu manager |
| **#86** | Same add-on repeats 1–10 times | Add-on quantity × meal quantity, independently linked priced line in quote, sale and invoice |

**Consolidated source:** [PRD v0.3.3](./PRD_v0.3.3_STAGING_UNIFIED.md). These decisions supersede the prior unsigned/reviewer-suggested rules, not all unrelated v0.3.2 requirements.

## Mandatory calculation tests (integer halalas)

1. 10000 inclusive with 10% invoice discount → gross 9000, VAT 1174, net 7826.
2. 400 inclusive with 10% discount → gross 360, VAT 47, net 313.
3. Independently priced 3400 meal + three 500 add-on lines → 4900 gross; 443+65+65+65 = 638 VAT.
4. 3400+500 with 100 fixed invoice discount → allocate 87/13; new gross 3313/487; VAT 432/64; totals 3800 gross, 496 VAT, 3304 net.
5. One line of 500×3 → 1500 gross, 196 VAT on the **entire line**, not 65×3.
6. 3200+500+300 with 15% invoice discount → allocate 480/75/45; 3400 gross, 443 VAT, 2957 net.
7. Discount larger than invoice/line gross → server rejects in Arabic.

Additional property test: sum allocated line discounts equals invoice discount, and every line `gross = vat + net`. Mongo replica integration tests for replay, response loss/retry, two cashiers, no gaps, stale revision, price tamper, concurrent over-refund and fully bounded pro-rata refunds. Synthetic browser four viewports cover sale/receipt/return.

## Remaining verification and strict deployment gates

- **#84 Railway Wait for CI:** Railway Staging dashboard configuration still reports `source.checkSuites=false`. The available connector cannot change that property, nor verify that a failing workflow blocks a deployment. **Keep issue OPEN.** Interim mitigation: pin the Staging dashboard source to a green CI commit, rather than automatically deploying future pushes; not equivalent to `Wait for CI=true`.
- **Operational acceptance:** Synthetic four-viewport Playwright and disposable Mongo replica tests do not substitute for a real Staging cashier session, a database backup-and-restore exercise and all relevant isolation checks.
- **ZATCA Q-011:** Staging prints **«فاتورة تجريبية — غير ضريبية»**. Legal invoice/tax configuration remains unresolved and is an explicit blocker to any Production sale. No production ticket, terminal charge, payment provider or fiscal transmission is authorized.
- **Subscriptions and daily close:** POS subscription writes, final immutable end-of-day close and live fiscal settlement are separate later gates; Stage F does not claim these complete.

## PR and evidence ledger

- Backend implementation: [PR #198](https://github.com/IbrahimMohamed101/basicdiet145/pull/198), merged to **Staging backend**; seven VAT vectors, property tests, replica-set integration and four green checks.
- Dashboard implementation: [PR #89](https://github.com/IbrahimMohamed101/client_dashbourd/pull/89), merged to **Staging dashboard**; four green checks, including browser sale and refund in four sizes.
- Audit/publishedBy and current docs follow-up: linked from subsequent Staging-only PRs; never merge to `main` without separate owner approval.
