import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.POS_QA_URL || "http://127.0.0.1:4173";
assert.equal(new URL(base).hostname, "127.0.0.1",
  "Stage F browser tests MUST NOT hit a live backend or production database");
const destination = process.env.POS_QA_EVIDENCE || "/tmp/basicdiet-pos-stage-f";
await fs.mkdir(destination, { recursive: true });

const catalog = {
  revision: 7,
  channels: [{ id: "restaurant", label: "المطعم" },
    { id: "hungerstation", label: "HungerStation" },
    { id: "keeta", label: "Keeta" }],
  categories: [{ id: "drinks", label: "المشروبات" },
    { id: "meals", label: "الوجبات" }, { id: "addons", label: "الإضافات" }],
  products: [
    { id: "water", name: "مياه", category: "drinks", active: true,
      variants: [{ id: "bottle", label: "عبوة",
        prices: { restaurant: 300, hungerstation: 400, keeta: 400 } }] },
    { id: "meal", name: "وجبة تجربة", category: "meals", active: true, hasAddons: true,
      variants: [{ id: "150", label: "150 جم",
        prices: { restaurant: 3400, hungerstation: 4000, keeta: 3900 } }] },
    { id: "extra-chicken", name: "زيادة دجاج", category: "addons", active: true,
      sellStandalone: false, variants: [{ id: "portion", label: "حصة",
        prices: { restaurant: 500, hungerstation: 600, keeta: 600 } }] },
  ],
};
const user = {
  id: "synthetic-cashier-qa", role: "cashier", name: "كاشير تجريبي",
  email: "cashier@synthetic.example.test", isActive: true,
};
const json = data => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
const viewports = [{ width: 1366, height: 768 }, { width: 1280, height: 800 },
  { width: 1024, height: 768 }, { width: 768, height: 1024 }];
const vat = gross => Math.floor((gross * 30 + 115) / 230);

function finalQuote(input) {
  let lineIndex = 0;
  const lines = [];
  for (const item of input.items) {
    const product = catalog.products.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    assert.ok(product && variant, "Synthetic quote may only use fixture catalog");
    const amount = variant.prices[input.channel];
    const baseTotal = amount * item.quantity;
    lines.push({
      id: "i" + lineIndex, parentLineId: null, kind: "product", productId: product.id,
      variantId: variant.id, name: product.name, variantLabel: variant.label,
      quantity: item.quantity, unitPriceHalalas: amount,
      beforeDiscountHalalas: baseTotal, lineDiscountHalalas: 0,
      invoiceDiscountPartHalalas: 0, grossHalalas: baseTotal,
      vatHalalas: vat(baseTotal), netHalalas: baseTotal - vat(baseTotal),
      discount: item.discount ?? null,
    });
    for (let i = 0; i < item.addons.length; i++) {
      const requested = item.addons[i];
      const addon = catalog.products.find(p => p.id === requested.productId);
      assert.ok(addon);
      const count = requested.quantity * item.quantity;
      const total = addon.variants[0].prices[input.channel] * count;
      lines.push({
        id: "i" + lineIndex + ":a" + i, parentLineId: "i" + lineIndex,
        kind: "addon", productId: addon.id, variantId: addon.variants[0].id,
        name: addon.name, variantLabel: addon.variants[0].label,
        quantity: count, perMealAddonQuantity: requested.quantity,
        unitPriceHalalas: addon.variants[0].prices[input.channel],
        beforeDiscountHalalas: total, lineDiscountHalalas: 0,
        invoiceDiscountPartHalalas: 0, grossHalalas: total,
        vatHalalas: vat(total), netHalalas: total - vat(total), discount: null,
      });
    }
    lineIndex += 1;
  }
  const before = lines.reduce((sum, line) => sum + line.beforeDiscountHalalas, 0);
  const lineDiscount = 0;
  let invoiceDiscount = 0;
  if (input.invoiceDiscount?.type === "percent") {
    invoiceDiscount = Math.floor((before * input.invoiceDiscount.value * 100 + 5000) / 10000);
  } else if (input.invoiceDiscount?.type === "fixed") invoiceDiscount = input.invoiceDiscount.value;
  if (invoiceDiscount > before) throw new Error("Mock only accepts valid discount");
  // Mock single-line invoice-percent allocation for this controlled browser
  // fixture; the real Mongo integration tests verify largest-remainder multi-line.
  if (invoiceDiscount && lines.length === 1) {
    lines[0].invoiceDiscountPartHalalas = invoiceDiscount;
    lines[0].grossHalalas -= invoiceDiscount;
    lines[0].vatHalalas = vat(lines[0].grossHalalas);
    lines[0].netHalalas = lines[0].grossHalalas - lines[0].vatHalalas;
  }
  const totals = {
    beforeDiscountHalalas: before, lineDiscountHalalas: lineDiscount,
    invoiceDiscountHalalas: invoiceDiscount, totalDiscountHalalas: lineDiscount + invoiceDiscount,
    grossHalalas: lines.reduce((sum, line) => sum + line.grossHalalas, 0),
    vatHalalas: lines.reduce((sum, line) => sum + line.vatHalalas, 0),
    netHalalas: lines.reduce((sum, line) => sum + line.netHalalas, 0),
  };
  return {
    revision: catalog.revision, channel: input.channel, currency: "SAR",
    kind: "STAGING_TEST_NON_TAX", note: "فاتورة تجريبية — غير ضريبية",
    rounding: "HALF_UP_PER_LINE", vatRate: "15%",
    invoiceDiscount: input.invoiceDiscount ?? null, lines, totals,
  };
}

const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const failures = [];
    const invoices = [];
    const refunds = [];
    const idempotency = new Map();
    const operations = new Map();
    let nextSaleFault = null; // reject / abort-before / abort-after
    let nextRefundFault = null; // reject / abort-before / abort-after
    page.on("pageerror", e => failures.push(e.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      const method = route.request().method();
      const path = url.pathname;
      if (path.endsWith("/api/dashboard/auth/me")) return route.fulfill(json({
        status: true, token: "synthetic-no-live-auth", user,
      }));
      if (path.endsWith("/api/dashboard/pos/status")) return route.fulfill(json({
        status: true, data: { enabled: true, environment: "staging",
          financialWritesEnabled: true, documentType: "STAGING_TEST_NON_TAX" },
      }));
      if (path.endsWith("/api/dashboard/pos/catalog")) return route.fulfill(json({
        status: true, data: catalog,
      }));
      if (path.endsWith("/api/dashboard/pos/checkout/quote") && method === "POST") {
        return route.fulfill(json({ status: true, data: finalQuote(route.request().postDataJSON()) }));
      }
      if (path.endsWith("/api/dashboard/pos/quote") && method === "POST") {
        return route.fulfill({ status: 403, contentType: "application/json",
          body: JSON.stringify({ error: { code: "LEGACY_READ_ONLY" } }) });
      }
      if (/\/api\/dashboard\/pos\/operations\/active\/(sale|refund)$/.test(path)
        && method === "GET") {
        const kind = path.split("/").at(-1);
        const pending = [...operations.entries()]
          .find(([, value]) => value.kind === kind && value.status === "pending");
        return route.fulfill(json({ status: true, data: pending
          ? { key: pending[0], status: "pending", kind } : null }));
      }
      if (/\/api\/dashboard\/pos\/operations\/[^/]+$/.test(path) && method === "GET") {
        const key = decodeURIComponent(path.split("/").at(-1));
        const state = operations.get(key);
        return route.fulfill(state ? json({ status: true, data: state }) : {
          status: 404, contentType: "application/json",
          body: JSON.stringify({ error: { code: "POS_OPERATION_NOT_FOUND" } }),
        });
      }
      if (/\/api\/dashboard\/pos\/operations\/[^/]+\/abandon$/.test(path)
        && method === "POST") {
        const key = decodeURIComponent(path.split("/").at(-2));
        const state = operations.get(key);
        const response = state?.status === "committed"
          ? state : { kind: route.request().postDataJSON().kind, status: "abandoned",
              resultId: null, resultNumber: null, errorCode: null };
        operations.set(key, response);
        return route.fulfill(json({ status: true, data: response }));
      }
      if (/\/api\/dashboard\/pos\/sales\/[a-f0-9]{24}$/.test(path)
        && method === "GET") {
        const record = invoices.find(item => item._id === path.split("/").at(-1));
        return route.fulfill(record ? json({ status: true, data: record }) : {
          status: 404, contentType: "application/json",
          body: '{"error":{"code":"POS_INVOICE_NOT_FOUND"}}',
        });
      }
      if (/\/api\/dashboard\/pos\/refunds\/[a-f0-9]{24}$/.test(path)
        && method === "GET") {
        const record = refunds.find(item => item._id === path.split("/").at(-1));
        return route.fulfill(record ? json({ status: true, data: record }) : {
          status: 404, contentType: "application/json",
          body: '{"error":{"code":"POS_REFUND_NOT_FOUND"}}',
        });
      }
      if (path.endsWith("/api/dashboard/pos/sales") && method === "POST") {
        const input = route.request().postDataJSON();
        const key = route.request().headers()["idempotency-key"];
        assert.ok(key && key.length >= 16, "sale requires idempotency key");
        const signature = JSON.stringify(input);
        const fault = nextSaleFault;
        nextSaleFault = null;
        if (fault === "reject") {
          operations.set(key, { status: "rejected", kind: "sale",
            errorCode: "POS_CATALOG_CONFLICT", resultId: null, resultNumber: null });
          return route.fulfill({ status: 409, contentType: "application/json",
            body: JSON.stringify({ error: { code: "POS_CATALOG_CONFLICT",
              message: "المنيو اتغيّر أثناء التأكيد" } }) });
        }
        if (fault === "abort-before") return route.abort("failed");
        let invoice = idempotency.get(key);
        if (invoice) assert.equal(signature, invoice.signature, "replay must keep exact sale intent");
        else {
          const quote = finalQuote(input);
          invoice = {
            signature, _id: (invoices.length + 1).toString(16).padStart(24, "0"),
            number: "STG-000001",
            sequence: 1, publishedRevision: input.revision, channel: input.channel,
            serviceMode: input.serviceMode, actor: {
              id: user.id, name: user.name, email: user.email, role: "cashier",
            },
            issuedAt: "2026-11-07T18:00:00.000Z",
            note: "فاتورة تجريبية — غير ضريبية", lines: quote.lines, totals: quote.totals,
            externalOrderNumber: null, appPaymentStatus: null,
            tender: input.tender.method === "cash"
              ? { method: "cash", receivedHalalas: input.tender.receivedHalalas,
                  changeHalalas: input.tender.receivedHalalas - quote.totals.grossHalalas }
              : { method: "network", receivedHalalas: null, changeHalalas: null },
          };
          idempotency.set(key, invoice);
          invoices.push(invoice);
        }
        operations.set(key, { status: "committed", kind: "sale",
          resultId: invoice._id, resultNumber: invoice.number, errorCode: null });
        if (fault === "abort-after") return route.abort("failed");
        return route.fulfill(json({ status: true, data: invoice }));
      }
      if (path.endsWith("/api/dashboard/pos/sales") && method === "GET") {
        return route.fulfill(json({ status: true, data: invoices }));
      }
      if (path.match(/\/api\/dashboard\/pos\/sales\/[a-f0-9]{24}\/refunds$/) && method === "GET") {
        return route.fulfill(json({ status: true, data: refunds }));
      }
      if (path.endsWith("/api/dashboard/pos/refunds") && method === "POST") {
        const body = route.request().postDataJSON();
        const key = route.request().headers()["idempotency-key"];
        const fault = nextRefundFault;
        nextRefundFault = null;
        if (fault === "reject") {
          operations.set(key, { status: "rejected", kind: "refund",
            errorCode: "POS_CONFLICT", resultId: null, resultNumber: null });
          return route.fulfill({ status: 409, contentType: "application/json",
            body: '{"error":{"code":"POS_CONFLICT","message":"تغيرت الكمية المتاحة"}}' });
        }
        if (fault === "abort-before") return route.abort("failed");
        const existing = refunds.find(x => x._key === route.request().headers()["idempotency-key"]);
        if (existing) {
          operations.set(key, { status: "committed", kind: "refund",
            resultId: existing._id, resultNumber: existing.number, errorCode: null });
          return route.fulfill(json({ status: true, data: existing }));
        }
        assert.equal(body.reason.length >= 3, true);
        const grossHalalas = 300 * body.lines[0].quantity;
        const data = {
          _id: "222222222222222222222222", _key: route.request().headers()["idempotency-key"],
          invoiceId: body.invoiceId, invoiceNumber: "STG-000001",
          number: "STG-R-000001", reason: body.reason, method: body.method,
          recordedAt: "2026-11-07T18:01:00.000Z",
          actor: { id: user.id, name: user.name, email: user.email, role: user.role },
          lines: [{ ...body.lines[0], name: "مياه", variantLabel: "عبوة",
            grossHalalas, vatHalalas: vat(grossHalalas),
            netHalalas: grossHalalas - vat(grossHalalas) }],
          totals: { grossHalalas, vatHalalas: vat(grossHalalas),
            netHalalas: grossHalalas - vat(grossHalalas) },
          note: "مرتجع تجريبي — لا يمثل رد مبالغ فعلي",
        };
        refunds.push(data);
        operations.set(key, { status: "committed", kind: "refund",
          resultId: data._id, resultNumber: data.number, errorCode: null });
        if (fault === "abort-after") return route.abort("failed");
        return route.fulfill(json({ status: true, data }));
      }
      if (path.startsWith("/api/")) return route.fulfill({ status: 403,
        contentType: "application/json", body: '{"error":{"code":"QA_DENIED"}}' });
      return route.continue();
    });
    await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
    try {
      await page.getByTestId("pos-sale-viewport").waitFor({ timeout: 20000 });
      const cart = page.getByRole("complementary", { name: "السلة التجريبية" });
      await page.getByRole("region", { name: "الكتالوج التجريبي" })
        .getByRole("button", { name: /مياه/ }).click();
      await page.getByRole("region", { name: "تسعير الفاتورة النهائي" }).waitFor();
      const finalReview = page.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" });
      assert.equal(await finalReview.isEnabled(), true, "Validated server quote enables review");
      await finalReview.click();
      const checkout = page.getByRole("dialog", { name: /مراجعة الطلب وتأكيد الفاتورة التجريبية/ });
      await checkout.waitFor();
      const issue = checkout.getByRole("button", { name: /تأكيد البيع وإصدار الفاتورة التجريبية/ });
      const modalBounds = await checkout.boundingBox();
      const issueBounds = await issue.boundingBox();
      assert.ok(modalBounds && issueBounds && issueBounds.y + issueBounds.height <= viewport.height + 1,
        "Sale confirmation must be on-screen at every viewport");
      await issue.click();
      const receipt = page.getByRole("dialog", { name: /فاتورة STG-000001/ });
      await receipt.waitFor();
      assert.equal(invoices.length, 1, "One confirmation creates one invoice");
      assert.match(await receipt.innerText(), /تجريبية — Staging/);
      assert.match(await receipt.innerText(), /ضريبة القيمة المضافة/);
      assert.equal(await cart.getByRole("listitem").count(), 0, "Cart clears after saved sale");
      await receipt.getByRole("button", { name: "إغلاق", exact: true }).click();
      await page.getByRole("button", { name: "أقسام نقطة البيع" }).click();
      await page.getByRole("menuitem", { name: "الطلبات والفواتير" }).click();
      await page.getByRole("button", { name: "عرض / مرتجع" }).click();
      const detail = page.getByRole("dialog", { name: /فاتورة STG-000001/ });
      await detail.getByRole("button", { name: "تسجيل مرتجع" }).click();
      const refundDialog = page.getByRole("dialog", { name: /مرتجع الفاتورة STG-000001/ });
      await refundDialog.waitFor();
      await refundDialog.getByRole("spinbutton", { name: "كمية مرتجع مياه" }).fill("1");
      await refundDialog.getByRole("textbox", { name: "سبب المرتجع" })
        .fill("إرجاع تجريبي بطلب العميل");
      const register = refundDialog.getByRole("button", { name: "تسجيل المرتجع التجريبي" });
      assert.equal(await register.isEnabled(), true);
      await register.click();
      assert.equal(refunds.length, 1, "One refund document for selected invoice");
      await page.getByText(/تم تسجيل الإشعار الدائن STG-R-000001/).waitFor();
      // Browser regression: final catalog 409 is not allowed to lock the
      // cashier even when the cart changes and the page gets reloaded.
      async function startFreshCheckout() {
        await page.evaluate(() => sessionStorage.clear());
        await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
        await page.getByTestId("pos-sale-viewport").waitFor();
        await page.getByRole("region", { name: "الكتالوج التجريبي" })
          .getByRole("button", { name: /مياه/ }).click();
        await page.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" }).click();
        const dialog = page.getByRole("dialog", {
          name: /مراجعة الطلب وتأكيد الفاتورة التجريبية/,
        });
        await dialog.waitFor();
        return dialog;
      }
      let attemptDialog = await startFreshCheckout();
      nextSaleFault = "reject";
      await attemptDialog.getByRole("button", { name: /تأكيد البيع/ }).click();
      await attemptDialog.getByText(/المنيو اتحدّث/).waitFor();
      assert.equal(await attemptDialog.getByRole("button",
        { name: "إعادة المحاولة", exact: true }).count(), 0);
      await attemptDialog.getByRole("button", { name: "رجوع للسلة" }).click();
      await page.getByRole("region", { name: "الكتالوج التجريبي" })
        .getByRole("button", { name: /مياه/ }).click();
      await page.reload();
      await page.getByTestId("pos-sale-viewport").waitFor();
      await page.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" }).click();
      attemptDialog = page.getByRole("dialog", {
        name: /مراجعة الطلب وتأكيد الفاتورة التجريبية/,
      });
      const beforeResale = invoices.length;
      await attemptDialog.getByRole("button", { name: /تأكيد البيع/ }).click();
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ }).waitFor();
      assert.equal(invoices.length, beforeResale + 1,
        "409 followed by cart change and reload must allow new sale");
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ })
        .getByRole("button", { name: "إغلاق", exact: true }).click();

      // Timeout after committed write: retry with EXACT same key, one invoice.
      attemptDialog = await startFreshCheckout();
      const beforeRetry = invoices.length;
      nextSaleFault = "abort-after";
      await attemptDialog.getByRole("button", { name: /تأكيد البيع/ }).click();
      await attemptDialog.getByRole("button", { name: "إعادة المحاولة" }).waitFor();
      await attemptDialog.getByRole("button", { name: "إعادة المحاولة" }).click();
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ }).waitFor();
      assert.equal(invoices.length, beforeRetry + 1,
        "timeout/retry must replay one invoice, not insert a second");
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ })
        .getByRole("button", { name: "إغلاق", exact: true }).click();

      // Timeout after the write: leaving dialog inspects the committed
      // operation and displays its receipt, never issues another sale.
      attemptDialog = await startFreshCheckout();
      const beforeRecover = invoices.length;
      nextSaleFault = "abort-after";
      await attemptDialog.getByRole("button", { name: /تأكيد البيع/ }).click();
      await attemptDialog.getByRole("button", { name: "إلغاء المحاولة" }).waitFor();
      await attemptDialog.getByRole("button", { name: "رجوع للسلة" }).click();
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ }).waitFor();
      assert.equal(invoices.length, beforeRecover + 1,
        "committed operation must show previous receipt, not new sale");
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ })
        .getByRole("button", { name: "إغلاق", exact: true }).click();

      // Timeout BEFORE the request reaches the server: unknown 404 may be
      // abandoned only by writing a tombstone; a subsequent sale succeeds.
      attemptDialog = await startFreshCheckout();
      const beforeAbsent = invoices.length;
      nextSaleFault = "abort-before";
      await attemptDialog.getByRole("button", { name: /تأكيد البيع/ }).click();
      await attemptDialog.getByRole("button", { name: "إلغاء المحاولة" }).waitFor();
      await attemptDialog.getByRole("button", { name: "رجوع للسلة" }).click();
      await page.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" }).click();
      attemptDialog = page.getByRole("dialog", {
        name: /مراجعة الطلب وتأكيد الفاتورة التجريبية/,
      });
      await attemptDialog.getByRole("button", { name: /تأكيد البيع/ }).click();
      await page.getByRole("dialog", { name: /فاتورة STG-000001/ }).waitFor();
      assert.equal(invoices.length, beforeAbsent + 1,
        "server-side tombstone permits a NEW safe sale");
      await page.screenshot({ path: destination + "/f-safety-"
        + viewport.width + "x" + viewport.height + ".png" });

      // Refund regression follows the identical durable-operation protocol.
      async function startFreshRefund() {
        refunds.splice(0); // Separate synthetic fixture scenario only.
        await page.evaluate(() => sessionStorage.clear());
        await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
        await page.getByTestId("pos-sale-viewport").waitFor();
        await page.getByRole("button", { name: "أقسام نقطة البيع" }).click();
        await page.getByRole("menuitem", { name: "الطلبات والفواتير" }).click();
        await page.getByRole("button", { name: "عرض / مرتجع" }).first().click();
        const detail = page.getByRole("dialog", { name: /فاتورة STG-000001/ });
        await detail.getByRole("button", { name: "تسجيل مرتجع" }).click();
        const form = page.getByRole("dialog", { name: /مرتجع الفاتورة STG-000001/ });
        await form.waitFor();
        await form.getByRole("spinbutton", { name: "كمية مرتجع مياه" }).fill("1");
        await form.getByRole("textbox", { name: "سبب المرتجع" })
          .fill("إرجاع تجريبي بطلب العميل");
        return form;
      }
      // Terminal 409 is rejected, immediately allowing a new refund key.
      let refundForm = await startFreshRefund();
      nextRefundFault = "reject";
      await refundForm.getByRole("button", { name: "تسجيل المرتجع التجريبي" }).click();
      await refundForm.getByText(/تغيرت الكمية المتاحة/).waitFor();
      await refundForm.getByRole("button", { name: "تسجيل المرتجع التجريبي" }).click();
      await page.getByText(/تم تسجيل الإشعار الدائن STG-R-000001/).waitFor();
      assert.equal(refunds.length, 1, "409 rejection must release refund key");

      // Unknown response after a committed refund: SAME key retry yields 1.
      refundForm = await startFreshRefund();
      nextRefundFault = "abort-after";
      await refundForm.getByRole("button", { name: "تسجيل المرتجع التجريبي" }).click();
      await refundForm.getByRole("button", { name: "إعادة المحاولة" }).waitFor();
      await refundForm.getByRole("button", { name: "إعادة المحاولة" }).click();
      await page.getByText(/تم تسجيل الإشعار الدائن STG-R-000001/).waitFor();
      assert.equal(refunds.length, 1, "refund timeout/retry cannot duplicate partial refund");

      // Unknown response after commit, user presses Cancel: original refund
      // receipt must be recovered from operation state instead of re-recorded.
      refundForm = await startFreshRefund();
      nextRefundFault = "abort-after";
      await refundForm.getByRole("button", { name: "تسجيل المرتجع التجريبي" }).click();
      await refundForm.getByRole("button", { name: "إلغاء المحاولة" }).waitFor();
      await refundForm.getByRole("button", { name: "إلغاء", exact: true }).click();
      await page.getByText(/تم تسجيل الإشعار الدائن STG-R-000001/).waitFor();
      assert.equal(refunds.length, 1, "refund receipt recovery must not record twice");

      // Unknown response that never reached the server: tombstone it first,
      // then safely accept a newly keyed refund, including after page reload.
      refundForm = await startFreshRefund();
      nextRefundFault = "abort-before";
      await refundForm.getByRole("button", { name: "تسجيل المرتجع التجريبي" }).click();
      await refundForm.getByRole("button", { name: "إلغاء المحاولة" }).waitFor();
      await refundForm.getByRole("button", { name: "إلغاء", exact: true }).click();
      assert.equal(refunds.length, 0, "abandoned absent refund creates no document");
      await page.reload();
      refundForm = await startFreshRefund();
      await refundForm.getByRole("button", { name: "تسجيل المرتجع التجريبي" }).click();
      await page.getByText(/تم تسجيل الإشعار الدائن STG-R-000001/).waitFor();
      assert.equal(refunds.length, 1, "new refund after abandon must succeed");
      await page.screenshot({ path: destination + "/f-refund-safety-"
        + viewport.width + "x" + viewport.height + ".png" });

      assert.deepEqual(failures, [], "Unexpected frontend exception");
      await page.screenshot({ path: destination + "/f-" + viewport.width + "x" + viewport.height + ".png" });
      report.push({ viewport, invoiceCount: invoices.length,
        refundCount: refunds.length, status: "PASS" });
    } catch (error) {
      console.error("POS Stage F synthetic browser failure", {
        viewport, failures, url: page.url(),
        body: (await page.locator("body").innerText()).slice(0, 1800),
      });
      await page.screenshot({ path: destination + "/failed-" + viewport.width + "x" + viewport.height + ".png" });
      throw error;
    } finally {
      await context.close();
    }
  }
  await fs.writeFile(destination + "/results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
