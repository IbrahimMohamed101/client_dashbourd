import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

// Production DOCUMENT TYPE simulated on loopback only. No production calls/writes.
const base = process.env.POS_QA_URL ?? "http://127.0.0.1:4173";
assert.equal(new URL(base).hostname, "127.0.0.1", "Screenshots must be local synthetic only");
const output = process.env.POS_QA_EVIDENCE ?? "/tmp/basicdiet-pos-production-trial";
await fs.mkdir(output, { recursive: true });
const json = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
const cashier = {
  id: "synthetic-operator", role: "cashier", name: "كاشير اختبار",
  email: "synthetic@example.test", isActive: true,
};
const catalog = {
  revision: 3,
  channels: [
    { id: "restaurant", label: "المطعم" },
    { id: "jahez", label: "جاهز منشور" },
    { id: "keeta", label: "كيتا" },
  ],
  categories: [{ id: "drinks", label: "المشروبات" }],
  products: [{ id: "water", name: "مياه", category: "drinks", active: true,
    variants: [{ id: "bottle", label: "عبوة",
      prices: { restaurant: 700, jahez: 900, keeta: null } }] }],
};
const line = {
  id: "i0", parentLineId: null, kind: "product",
  productId: "water", variantId: "bottle", name: "مياه", variantLabel: "عبوة",
  quantity: 1, unitPriceHalalas: 700, beforeDiscountHalalas: 700,
  lineDiscountHalalas: 0, invoiceDiscountPartHalalas: 0,
  grossHalalas: 700, netHalalas: 609, vatHalalas: 91, discount: null,
};
const totals = { beforeDiscountHalalas: 700, lineDiscountHalalas: 0,
  invoiceDiscountHalalas: 0, totalDiscountHalalas: 0,
  grossHalalas: 700, netHalalas: 609, vatHalalas: 91 };
const quote = { revision: catalog.revision, channel: "restaurant", currency: "SAR",
  kind: "STAGING_TEST_NON_TAX", rounding: "HALF_UP_PER_LINE", vatRate: "15%",
  invoiceDiscount: null, lines: [line], totals, note: "Synthetic quote, not an invoice" };
const invoice = {
  _id: "111111111111111111111111", number: "QA-000001", sequence: 1,
  documentType: "SIMPLIFIED_TAX_INVOICE", documentKind: "SIMPLIFIED_TAX_INVOICE",
  publishedRevision: 3, channel: "restaurant", serviceMode: "restaurant",
  actor: { id: cashier.id, name: cashier.name, email: cashier.email, role: cashier.role },
  issuedAt: "2026-11-14T00:00:00.000Z", note: "Synthetic invoice",
  lines: [line], totals, tender: { method: "network" },
  externalOrderNumber: null, appPaymentStatus: null,
};
const appInvoice = {
  ...invoice, _id: "222222222222222222222222", number: "QA-000002",
  channel: "jahez", tender: { method: "app_receivable", reportedStatus: "paid" },
};
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const width of [1280, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1280 ? 800 : 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    const writes = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      const path = url.pathname;
      const method = route.request().method();
      if (path.endsWith("/api/dashboard/auth/me")) {
        return route.fulfill(json({ status: true, token: "synthetic-only", user: cashier }));
      }
      if (path.endsWith("/api/dashboard/pos/status")) {
        return route.fulfill(json({ status: true, data: {
          enabled: true, environment: "production", financialWritesEnabled: true,
          documentType: "SIMPLIFIED_TAX_INVOICE",
        } }));
      }
      if (path.endsWith("/api/dashboard/pos/catalog")) {
        return route.fulfill(json({ status: true, data: catalog }));
      }
      if (path.endsWith("/api/dashboard/pos/checkout/quote") && method === "POST") {
        assert.equal(route.request().postDataJSON().channel, "restaurant");
        return route.fulfill(json({ status: true, data: quote }));
      }
      if (path.endsWith("/api/dashboard/pos/sales") && method === "GET") {
        return route.fulfill(json({ status: true, data: [invoice, appInvoice] }));
      }
      if (path.match(/\/api\/dashboard\/pos\/sales\/[a-f0-9]{24}\/refunds$/) && method === "GET") {
        return route.fulfill(json({ status: true, data: [] }));
      }
      if (path.startsWith("/api/")) {
        if (method !== "GET") writes.push({ method, path });
        return route.fulfill({ status: 403, contentType: "application/json",
          body: '{"error":{"code":"QA_DENIED"}}' });
      }
      return route.continue();
    });
    try {
      await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
      const catalogRegion = page.getByRole("region", { name: "كتالوج نقطة البيع" });
      await catalogRegion.waitFor({ timeout: 20000 });
      await catalogRegion.getByRole("button", { name: /مياه/ }).click();
      const serverPricing = page.getByRole("region", { name: "تسعير الفاتورة النهائي" });
      await serverPricing.waitFor({ timeout: 20000 });
      assert.match(await serverPricing.innerText(), /تسعير السيرفر · المنيو 3/);
      assert.doesNotMatch(await serverPricing.innerText(), /Staging/);
      await page.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" }).click();
      const confirm = page.getByRole("dialog", { name: "مراجعة الطلب وإصدار الفاتورة" });
      await confirm.waitFor();
      assert.match(await confirm.innerText(), /فاتورة ضريبية مبسطة — يتم إصدارها برقم تسلسلي ورمز QR/);
      assert.match(await confirm.innerText(), /وسيلة الدفع/);
      assert.doesNotMatch(await confirm.innerText(), /Staging|تجريبية|غير ضريبية/);
      assert.equal(await confirm.getByRole("button", {
        name: "تأكيد البيع وإصدار الفاتورة",
      }).isEnabled(), true);
      const confirmFile = output + "/production-confirm-" + width + ".png";
      await page.screenshot({ path: confirmFile, fullPage: true });

      // Do not perform a sale. Read an isolated synthetic invoice from the mocked GET.
      await confirm.getByRole("button", { name: "رجوع للسلة" }).click();
      await page.getByRole("button", { name: "أقسام نقطة البيع" }).click();
      await page.getByRole("menuitem", { name: "الطلبات والفواتير" }).click();
      const rows = page.getByRole("row");
      await rows.filter({ hasText: "QA-000002" }).waitFor();
      assert.match(await rows.filter({ hasText: "QA-000002" }).innerText(), /جاهز منشور/);
      await rows.filter({ hasText: "QA-000001" })
        .getByRole("button", { name: "عرض / مرتجع" }).click();
      const receipt = page.getByRole("dialog", { name: /فاتورة QA-000001/ });
      await receipt.getByRole("button", { name: "تسجيل مرتجع" }).click();
      const refund = page.getByRole("dialog", { name: /مرتجع الفاتورة QA-000001/ });
      await refund.waitFor();
      assert.equal(await refund.getByRole("button", { name: "شبكة" })
        .getAttribute("aria-pressed"), "true", "Refund must default to network");
      const refundFile = output + "/production-refund-" + width + ".png";
      await page.screenshot({ path: refundFile, fullPage: true });
      await refund.getByRole("button", { name: "كاش" }).click();
      assert.equal(await refund.getByRole("button", { name: "كاش" })
        .getAttribute("aria-pressed"), "true", "Operator can change refund method");
      assert.deepEqual(writes, [], "Browser QA must not issue financial writes");
      assert.deepEqual(errors, [], "No client page exceptions");
      report.push({ viewport: width, status: "PASS", confirmation: confirmFile,
        refund: refundFile, runtimeDocumentType: "SIMPLIFIED_TAX_INVOICE",
        salesOrRefundWrites: writes.length });
    } catch (cause) {
      console.error("Production-mode synthetic screenshots failed", {
        width, errors, body: (await page.locator("body").innerText()).slice(0, 1500),
      });
      await page.screenshot({ path: output + "/failure-" + width + ".png" });
      throw cause;
    } finally {
      await context.close();
    }
  }
  await fs.writeFile(output + "/results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
