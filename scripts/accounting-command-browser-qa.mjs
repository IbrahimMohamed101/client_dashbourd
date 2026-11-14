import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

// Read-only synthetic browser fixture: absolutely no production hosts or writes.
const base = process.env.ACCOUNTING_QA_URL ?? "http://127.0.0.1:4173";
assert.equal(new URL(base).hostname, "127.0.0.1", "Only loopback browser QA is allowed");
const out = process.env.ACCOUNTING_QA_EVIDENCE ?? "/tmp/basicdiet-accounting-command";
await fs.mkdir(out, { recursive: true });
const asJson = (data) => ({
  status: 200, contentType: "application/json", body: JSON.stringify(data),
});
const user = { id: "synthetic-superadmin", role: "superadmin", name: "مدير اختبار",
  email: "synthetic@example.test", isActive: true };
const catalog = {
  revision: 3, categories: [], products: [], channels: [
    { id: "restaurant", label: "المطعم" }, { id: "jahez", label: "جاهز" },
    { id: "hungerstation", label: "هنجرستيشن" }, { id: "keeta", label: "كيتا" },
  ],
};
const issuedAt = "2026-11-14T12:00:00.000Z";
const makeInvoice = (number, channel, method, gross) => ({
  number, businessDate: "2026-11-14", issuedAt, channel,
  documentType: "SIMPLIFIED_TAX_INVOICE", externalOrderNumber: null,
  appPaymentStatus: channel === "restaurant" ? null : "paid",
  tender: { method },
  totals: { grossHalalas: gross, netHalalas: Math.round(gross / 1.15),
    vatHalalas: gross - Math.round(gross / 1.15) },
});
const invoices = [
  makeInvoice("QA-000001", "restaurant", "cash", 700),
  makeInvoice("QA-000002", "restaurant", "network", 700),
  makeInvoice("QA-000003", "jahez", "app_receivable", 900),
];
const refunds = [{
  number: "QA-R-000001", invoiceNumber: "QA-000002",
  channel: "restaurant", method: "network",
  reason: "مستند تجريبي مستقل", businessDate: "2026-11-14", recordedAt: issuedAt,
  totals: { grossHalalas: 700, vatHalalas: 91, netHalalas: 609 },
}];
function posReport(from, to) {
  return {
    reportType: "pos-range",
    range: { from, to, days: 30, timezone: "Asia/Riyadh",
      basis: "immutable POS businessDate" },
    summary: {
      invoiceCount: 3, grossHalalas: 2300, vatHalalas: 300,
      netBeforeVatHalalas: 2000, cashGrossHalalas: 700, networkGrossHalalas: 700,
      appReceivableGrossHalalas: 900, otherTenderGrossHalalas: 0,
      refundCount: 1, refundDocumentsHalalas: 700, refundVatHalalas: 91,
      cashRefundDocumentsHalalas: 0, networkRefundDocumentsHalalas: 700,
      externalRefundDocumentsHalalas: 0, netAfterRefundDocumentsHalalas: 1600,
    },
    channels: [
      { channel: "restaurant", invoiceCount: 2, grossHalalas: 1400,
        vatHalalas: 182, cashGrossHalalas: 700, networkGrossHalalas: 700,
        appReceivableGrossHalalas: 0, refundCount: 1, refundDocumentsHalalas: 700,
        refundVatHalalas: 91, netAfterRefundDocumentsHalalas: 700 },
      { channel: "jahez", invoiceCount: 1, grossHalalas: 900,
        vatHalalas: 118, cashGrossHalalas: 0, networkGrossHalalas: 0,
        appReceivableGrossHalalas: 900, refundCount: 0, refundDocumentsHalalas: 0,
        refundVatHalalas: 0, netAfterRefundDocumentsHalalas: 900 },
    ],
    daily: [{ businessDate: "2026-11-14", invoiceCount: 3,
      grossHalalas: 2300, refundCount: 1, refundDocumentsHalalas: 700,
      netAfterRefundDocumentsHalalas: 1600 }],
    invoices, refunds, generatedAt: issuedAt,
    pagination: { offset: 0, limit: 100, invoicesTotal: 3, refundsTotal: 1,
      invoicesHasMore: false, refundsHasMore: false },
    notes: ["synthetic only"],
  };
}
const subscriptionReport = {
  reportType: "range",
  range: { from: "2026-10-16", to: "2026-11-14", days: 30 },
  summary: { netCollectionHalala: 120000, grossCollectionHalala: 120000,
    refundsHalala: 0, totalPaymentsCount: 2, reviewItemsCount: 0 },
  dailyBreakdown: [{ businessDate: "2026-11-14", netCollectionHalala: 120000 }],
  items: [{ movementId: "syn-1", paymentReference: "SYN-1", businessDate: "2026-11-14",
    movementType: "collection", customerName: "عميل تجريبي", amountHalala: 120000,
    netMovementHalala: 120000, sourceChannel: "app",
    paymentMethod: "card", provider: "moyasar", needsReview: false }],
};
const onlineReport = {
  reportType: "one-time-range",
  range: { from: "2026-10-16", to: "2026-11-14", days: 30,
    timezone: "Asia/Riyadh", basis: "historical cutoff" },
  summary: { paidCount: 1, paidGrossHalalas: 1700,
    refundedStatusCount: 1, refundedStatusGrossHalalas: 900, unpricedPaidCount: 0 },
  daily: [{ businessDate: "2026-11-14", paidCount: 1, paidGrossHalalas: 1700,
    refundedStatusCount: 1, refundedStatusGrossHalalas: 900, unpricedPaidCount: 0 }],
  items: [{
    number: "SYN-ONLINE-1", businessDate: "2026-11-14", createdAt: issuedAt,
    paymentStatus: "paid", status: "fulfilled", fulfillmentMethod: "pickup",
    grossHalalas: 1700,
  }, {
    number: "SYN-ONLINE-2", businessDate: "2026-11-14", createdAt: issuedAt,
    paymentStatus: "refunded", status: "canceled", fulfillmentMethod: "pickup",
    grossHalalas: 900,
  }],
  pagination: { offset: 0, limit: 100, total: 2, hasMore: false },
  generatedAt: issuedAt, notes: ["synthetic only"],
};
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const width of [1366, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1366 ? 900 : 1000 },
      reducedMotion: "reduce", acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    const financialWrites = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      const path = url.pathname;
      const method = route.request().method();
      if (path.endsWith("/api/dashboard/auth/me")) return route.fulfill(asJson({
        status: true, token: "synthetic-only", user,
      }));
      if (path.endsWith("/api/dashboard/accounting/pos/range")) return route.fulfill(
        asJson({ status: true, data: posReport(
          url.searchParams.get("from"), url.searchParams.get("to"),
        ) }),
      );
      if (path.endsWith("/api/dashboard/accounting/one-time/range")) {
        return route.fulfill(asJson({ status: true, data: onlineReport }));
      }
      if (path.endsWith("/api/dashboard/accounting/subscription-payments/range")) {
        return route.fulfill(asJson({ status: true, data: subscriptionReport }));
      }
      if (path.endsWith("/api/dashboard/pos/catalog")) {
        return route.fulfill(asJson({ status: true, data: catalog }));
      }
      if (path.startsWith("/api/")) {
        if (method !== "GET") financialWrites.push(method + " " + path);
        return route.fulfill({ status: 403, contentType: "application/json",
          body: '{"error":{"code":"SYNTHETIC_ONLY"}}' });
      }
      return route.continue();
    });
    try {
      await page.goto(base + "/accounting", { waitUntil: "domcontentloaded" });
      const center = page.getByRole("region", { name: "مركز القيادة المالية" });
      await center.waitFor({ timeout: 25_000 });
      await center.getByText("1,200.00 ر.س").first().waitFor({ timeout: 25_000 });
      assert.match(await center.innerText(), /مستحقات تطبيقات التوصيل/);
      assert.match(await center.innerText(), /طلبات الدفع الفوري/);
      assert.match(await center.innerText(), /17.00 ر.س/);
      assert.match(await center.innerText(), /جاهز/);
      assert.match(await center.innerText(), /صافي الحركات المالية المسجلة/);
      assert.equal(await center.getByRole("button",
        { name: /تنزيل Excel شامل/ }).isEnabled(), true);
      const screenshot = out + "/superadmin-accounting-" + width + ".png";
      await page.screenshot({ path: screenshot, fullPage: true });
      if (width === 1366) {
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          center.getByRole("button", { name: /تنزيل Excel شامل/ }).click(),
        ]);
        assert.match(download.suggestedFilename(), /\.xlsx$/);
        const file = out + "/synthetic-financial-center.xlsx";
        await download.saveAs(file);
        const contents = await fs.readFile(file);
        assert.deepEqual([...contents.subarray(0, 2)], [0x50, 0x4B],
          "Downloaded file must be a real OOXML ZIP, not CSV/XLS HTML");
      }
      assert.deepEqual(financialWrites, [], "No financial writes in synthetic QA");
      assert.deepEqual(errors, [], "No client-side runtime exceptions");
      report.push({ width, status: "PASS", screenshot, financialWrites: 0 });
    } catch (error) {
      console.error("Synthetic accounting QA failed", {
        width, errors, body: (await page.locator("body").innerText()).slice(0, 1700),
      });
      await page.screenshot({ path: out + "/failed-" + width + ".png", fullPage: true });
      throw error;
    } finally {
      await context.close();
    }
  }
  await fs.writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
