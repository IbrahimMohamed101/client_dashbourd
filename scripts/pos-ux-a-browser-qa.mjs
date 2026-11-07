import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.env.POS_QA_URL || "http://127.0.0.1:4173";
const parsed = new URL(base);
assert.equal(parsed.hostname, "127.0.0.1", "POS browser QA must run against local disposable fixtures only");
const destination = process.env.POS_QA_EVIDENCE || "/tmp/basicdiet-pos-ux-a";
await fs.mkdir(destination, { recursive: true });

const catalog = {
  revision: 1,
  channels: [
    { id: "restaurant", label: "المطعم" },
    { id: "hungerstation", label: "HungerStation" },
    { id: "keeta", label: "Keeta" },
  ],
  categories: [
    { id: "meals", label: "الوجبات" },
    { id: "drinks", label: "المشروبات" },
  ],
  products: [
    { id: "water", name: "مياه", category: "drinks", active: true, variants: [
      { id: "bottle", label: "عبوة", prices: { restaurant: 300, hungerstation: 400, keeta: 400 } },
    ] },
    { id: "butter", name: "دجاج بالزبدة", category: "meals", active: true,
      hasAddons: false, variants: [
        { id: "100", label: "100 جم", prices: { restaurant: 2400, hungerstation: 2800, keeta: 2700 } },
        { id: "150", label: "150 جم", prices: { restaurant: 3200, hungerstation: 3600, keeta: 3500 } },
      ] },
  ],
};
// Use 40 synthetic items so browser QA measures responsive grid density,
// not only the first two demo product cards.
for (let i = 0; i < 38; i += 1) {
  catalog.products.push({
    id: "synthetic-item-" + i,
    name: "وجبة اختبار " + String(i + 1),
    category: "meals",
    active: true,
    variants: [{ id: "regular", label: "حصة", prices: { restaurant: 2500, hungerstation: 2900, keeta: 2800 } }],
  });
}
const user = {
  id: "synthetic-cashier-qa",
  role: "cashier",
  name: "كاشير تجريبي",
  email: "cashier@synthetic.example.test",
  isActive: true,
  lastLoginAt: "2026-11-05T10:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const json = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
const viewports = [
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
];
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      if (url.pathname.endsWith("/api/dashboard/auth/me")) {
        return route.fulfill(json({ status: true, token: "synthetic-qa-token-not-valid", user }));
      }
      if (url.pathname.endsWith("/api/dashboard/pos/catalog")) {
        return route.fulfill(json({ status: true, data: catalog }));
      }
      if (url.pathname.endsWith("/api/dashboard/pos/quote") && route.request().method() === "POST") {
        // Phase E: a disposable *read-only* mock, never a sale or payment.
        const request = route.request().postDataJSON();
        const lines = request.items.map((item) => {
          const product = catalog.products.find((entry) => entry.id === item.productId);
          const variant = product.variants.find((entry) => entry.id === item.variantId);
          const basePriceHalalas = variant.prices[request.channel];
          const lineTotalHalalas = basePriceHalalas * item.quantity;
          return {
            productId: product.id, name: product.name, variantId: variant.id,
            variantLabel: variant.label, quantity: item.quantity,
            basePriceHalalas, addons: [], unitPriceHalalas: basePriceHalalas, lineTotalHalalas,
          };
        });
        return route.fulfill(json({ status: true, data: {
          revision: catalog.revision, currency: "SAR", channel: request.channel,
          lines, itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
          provisionalSubtotalHalalas: lines.reduce((sum, line) => sum + line.lineTotalHalalas, 0),
          finalPayableHalalas: null, taxHalalas: null, discountHalalas: null,
          canCommit: false, note: "synthetic no-payment quote",
        } }));
      }
      if (url.pathname.startsWith("/api/")) {
        return route.fulfill({ status: 403, contentType: "application/json", body: '{"status":false,"error":{"code":"QA_DENIED"}}' });
      }
      return route.continue();
    });
    await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
    const sale = page.getByTestId("pos-sale-viewport");
    try {
      await sale.waitFor({ timeout: 14000 });
    } catch (error) {
      console.error("POS QA diagnostic", JSON.stringify({
        url: page.url(), viewport, errors,
        text: (await page.locator("body").innerText()).slice(0, 1600),
      }));
      await page.screenshot({ path: destination + "/failed-" + viewport.width + "x" + viewport.height + ".png" });
      throw error;
    }
    const cart = page.getByRole("complementary", { name: "السلة التجريبية" });
    const pay = cart.getByRole("button", { name: "الدفع غير متاح في المعاينة" });
    await pay.waitFor();
    // A header nested inside the dashboard main landmark is not an ARIA banner.
    const header = page.locator('header[aria-label="شريط البيع"]');
    const headerBox = await header.boundingBox();
    assert.ok(headerBox, "POS topbar must be visible");
    assert.ok(headerBox.height <= 64.5, "Topbar exceeds 64px: " + headerBox.height);
    assert.equal(await pay.isDisabled(), true, "Never enable live payment in UX phase A");
    const payBox = await pay.boundingBox();
    const cartBox = await cart.boundingBox();
    assert.ok(payBox && cartBox, "Cart and pay action must be on screen");
    assert.ok(payBox.height >= 56, "Pay action touch target must be >=56px");
    assert.ok(payBox.y + payBox.height <= viewport.height + 1,
      "Pay action clipped beyond viewport at " + viewport.width + "x" + viewport.height);
    assert.ok(cartBox.width >= 360 && cartBox.width <= 405,
      "Fixed cart width out of range: " + cartBox.width);
    const pageScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    assert.ok(pageScroll <= 1, "Page-level vertical scrolling is forbidden: " + pageScroll + "px");
    const firstCard = page.getByRole("button", { name: /مياه/ }).first();
    const firstCardBox = await firstCard.boundingBox();
    assert.ok(firstCardBox, "First product must be visible");
    assert.ok(firstCardBox.y <= 123,
      "Product grid begins too far below top bar: " + firstCardBox.y);
    const productCards = page.locator('section[aria-label="الكتالوج التجريبي"] .grid > button');
    assert.equal(await productCards.count(), 40, "Synthetic 40-item catalog must render in product pane");
    const firstRowCards = await Promise.all(
      Array.from({ length: 12 }, (_, index) => productCards.nth(index).boundingBox())
    );
    const firstRow = firstRowCards.filter((rect) => rect && Math.abs(rect.y - firstRowCards[0].y) <= 1);
    const expectedMinimumColumns = viewport.width >= 1200 ? 4 : viewport.width >= 1000 ? 3 : 2;
    assert.ok(firstRow.length >= expectedMinimumColumns,
      "Too few product columns for " + viewport.width + ": " + firstRow.length);
    assert.ok(firstRowCards[0].width <= 210,
      "Oversized product card width: " + firstRowCards[0].width + " at " + viewport.width);
    assert.ok(firstRowCards[0].height >= 48,
      "Product cards must remain touch accessible");


    await firstCard.click();
    await cart.getByText("سلة المطعم").waitFor();
    assert.equal(await pay.isDisabled(), true);
    const channelButtons = page.getByRole("group", { name: "قناة البيع" });
    const channelGroupBox = await channelButtons.boundingBox();
    assert.ok(channelGroupBox, "Channel selector group must be visible");
    if (viewport.width < 1280) {
      const selector = channelButtons.getByRole("button", { name: /تغيير قناة البيع:/ });
      const selectorBox = await selector.boundingBox();
      assert.ok(selectorBox, "Tablet channel dropdown must be visible");
      assert.ok(selectorBox.x >= channelGroupBox.x - 1 &&
        selectorBox.x + selectorBox.width <= channelGroupBox.x + channelGroupBox.width + 1,
      "Tablet channel button must fit fully inside its header group");
      assert.ok(selectorBox.x >= -1 && selectorBox.x + selectorBox.width <= viewport.width + 1,
        "Selected channel button is clipped by the viewport");
      await selector.click();
      for (const channelLabel of ["المطعم", "HungerStation", "Keeta"]) {
        const item = page.getByRole("menuitem", { name: channelLabel });
        const rect = await item.boundingBox();
        assert.ok(rect, "Every configured channel must be visible as a complete menu item: " + channelLabel);
        assert.ok(rect.x >= -1 && rect.x + rect.width <= viewport.width + 1,
          "Channel option " + channelLabel + " clipped at " + viewport.width + "px");
      }
      await page.getByRole("menuitem", { name: "HungerStation" }).click();
    } else {
      for (const channelLabel of ["المطعم", "HungerStation", "Keeta"]) {
        const item = channelButtons.getByRole("button", { name: channelLabel, exact: true });
        const rect = await item.boundingBox();
        assert.ok(rect && rect.x >= channelGroupBox.x - 1
          && rect.x + rect.width <= channelGroupBox.x + channelGroupBox.width + 1,
          "Desktop channel button is clipped: " + channelLabel);
      }
      await channelButtons.getByRole("button", { name: "HungerStation" }).click();
    }
    await page.getByRole("dialog", { name: "تغيير قناة البيع" }).waitFor();
    await page.getByRole("button", { name: "تأكيد تغيير القناة" }).click();
    await cart.getByText("سلة HungerStation").waitFor();
    // Phase B: edit a quick-added item, undo removal and restore the
    // cashier-scoped draft after a full reload. Only mocked local APIs.
    await cart.getByRole("button", { name: "تعديل مياه عبوة" }).click();
    const editing = page.getByRole("dialog", { name: /مياه/ });
    await editing.getByRole("button", { name: "زِد الكمية المختارة" }).click();
    await editing.getByRole("button", { name: /حفظ التعديل/ }).click();
    assert.match(await cart.getByRole("listitem").innerText(), /8\.00/,
      "Editing quantity must reprice 2 × 4.00 HungerStation water");
    await cart.getByRole("button", { name: "احذف مياه عبوة" }).click();
    assert.equal(await cart.getByRole("listitem").count(), 0);
    await cart.getByRole("button", { name: "تراجع عن الحذف" }).click();
    assert.match(await cart.getByRole("listitem").innerText(), /8\.00/,
      "Undo must restore the original cart line within five seconds");
    await page.reload({ waitUntil: "domcontentloaded" });
    await cart.getByText("سلة HungerStation").waitFor();
    assert.match(await cart.getByRole("listitem").innerText(), /8\.00/,
      "Session reload must restore cashier's published-revision cart");
    assert.equal(await pay.isDisabled(), true, "Restored cart cannot enable payment");
    if (viewport.width < 1280) {
      const selector = channelButtons.getByRole("button", { name: /تغيير قناة البيع:/ });
      await selector.click();
      await page.getByRole("menuitem", { name: "Keeta" }).click();
      await page.getByRole("dialog", { name: "تغيير قناة البيع" }).waitFor();
      await page.getByRole("button", { name: "تأكيد تغيير القناة" }).click();
      await cart.getByText("سلة Keeta").waitFor();
      const keetaSelector = channelButtons.getByRole("button", { name: "تغيير قناة البيع: Keeta" });
      const keetaBox = await keetaSelector.boundingBox();
      assert.ok(keetaBox && keetaBox.x >= -1
        && keetaBox.x + keetaBox.width <= viewport.width + 1,
        "Selected Keeta channel must remain fully visible at " + viewport.width + "px");
      assert.equal(await keetaSelector.isVisible(), true);
    }
    const updatedBox = await pay.boundingBox();
    assert.ok(updatedBox && updatedBox.y + updatedBox.height <= viewport.height + 1,
      "Payment footer must remain visible after changing channel");
    // Stage F safety: legacy Stage E price preview remains informational,
    // but no final invoice can be confirmed without the Stage F VAT quote.
    const reviewButton = cart.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" });
    assert.equal(await reviewButton.isDisabled(), true);
    await cart.getByRole("button", { name: "مراجعة الأسعار من السيرفر" }).click();
    await cart.getByRole("region", { name: "نتيجة تسعير السيرفر" }).waitFor();
    assert.equal(await reviewButton.isDisabled(), true,
      "Legacy read-only quote must never authorize a Stage F invoice");
    assert.equal(await pay.isDisabled(), true, "Legacy quote never activates payment");
    assert.deepEqual(errors, [], "Unexpected client-side errors in POS");
    await page.screenshot({ path: destination + "/pos-a-" + viewport.width + "x" + viewport.height + ".png" });
    report.push({ viewport, topbar: headerBox.height, cartWidth: cartBox.width,
      firstProductY: firstCardBox.y, columns: firstRow.length,
      productWidth: firstRowCards[0].width, payBottom: updatedBox.y + updatedBox.height,
      pageOverflow: pageScroll,
      channelVisibility: viewport.width < 1280 ? "tablet-dropdown-and-Keeta-visible"
        : "all-desktop-channel-buttons-visible",
      status: "PASS" });
    await context.close();
  }
  await fs.writeFile(destination + "/results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
