import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.env.POS_QA_URL ?? "http://127.0.0.1:4173";
assert.equal(new URL(base).hostname, "127.0.0.1", "Synthetic fixture only, no production URL");
const output = process.env.POS_QA_EVIDENCE ?? "/tmp/basicdiet-pos-channel-ux";
await fs.mkdir(output, { recursive: true });
const catalog = {
  revision: 1,
  channels: [
    { id: "restaurant", label: "المطعم" },
    { id: "keeta", label: "Keeta" },
    { id: "hungerstation", label: "HungerStation" },
    { id: "new-app", label: "تطبيق رابع" },
  ],
  categories: [{ id: "meals", label: "الوجبات" }, { id: "drinks", label: "المشروبات" }],
  products: [
    { id: "water", name: "مياه", category: "drinks", active: true, variants: [
      { id: "bottle", label: "عبوة", prices: {
        restaurant: 300, keeta: 400, hungerstation: null, "new-app": null,
      } },
    ] },
    { id: "chicken", name: "دجاج تجريبي", category: "meals", active: true, variants: [
      { id: "portion", label: "حصة", prices: {
        restaurant: 2400, keeta: null, hungerstation: null, "new-app": null,
      } },
    ] },
  ],
};
const cashier = {
  id: "pos-channel-ux-cashier", role: "cashier", name: "كاشير تجريبي",
  email: "synthetic@example.test", isActive: true,
};
const json = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [1280, 1920]) {
    const viewport = { width, height: width === 1280 ? 800 : 900 };
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      if (url.pathname.endsWith("/api/dashboard/auth/me")) {
        return route.fulfill(json({ status: true, token: "synthetic-only", user: cashier }));
      }
      if (url.pathname.endsWith("/api/dashboard/pos/status")) {
        return route.fulfill(json({ status: true, data: {
          enabled: true, environment: "staging", financialWritesEnabled: false,
          documentType: "STAGING_TEST_NON_TAX",
        } }));
      }
      if (url.pathname.endsWith("/api/dashboard/pos/catalog")) {
        return route.fulfill(json({ status: true, data: catalog }));
      }
      if (url.pathname.startsWith("/api/")) {
        return route.fulfill({ status: 403, contentType: "application/json",
          body: '{"status":false,"error":{"code":"QA_DENIED"}}' });
      }
      return route.continue();
    });
    await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
    const workspace = page.getByTestId("pos-sale-viewport");
    await workspace.waitFor({ timeout: 15000 });
    const strip = page.getByRole("group", { name: "قناة البيع" });
    assert.deepEqual(await strip.getByRole("button").allTextContents(), ["المطعم", "Keeta"],
      "Four configured channels but only two have priced active products");
    assert.equal(await page.getByRole("group", { name: "نوع طلب المطعم" }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "قنوات أخرى" }).count(), 0);
    for (const label of ["المطعم", "Keeta"]) {
      const rect = await strip.getByRole("button", { name: label }).boundingBox();
      assert.ok(rect && rect.height >= 48, label + " touch height below 48px");
    }
    await workspace.getByRole("button", { name: /دجاج تجريبي/ }).click();
    const cart = page.getByRole("complementary", { name: "السلة التجريبية" });
    assert.match(await cart.innerText(), /24\.00/);
    const file = output + "/sale-4-configured-2-priced-" + width + ".png";
    await page.screenshot({ path: file, fullPage: true });
    await strip.getByRole("button", { name: "Keeta" }).click();
    const dialog = page.getByRole("dialog", { name: "أصناف غير متاحة في القناة الجديدة" });
    await dialog.waitFor();
    assert.match(await dialog.innerText(), /دجاج تجريبي/);
    assert.equal(await cart.getByRole("listitem").count(), 1, "Must not remove unavailable items before confirmation");
    await dialog.getByRole("button", { name: "ارجع إلى المطعم" }).click();
    assert.equal(await strip.getByRole("button", { name: "المطعم" }).getAttribute("aria-pressed"), "true");
    await strip.getByRole("button", { name: "Keeta" }).click();
    await dialog.getByRole("button", { name: "احذف الأصناف غير المتاحة وكمّل" }).click();
    assert.equal(await cart.getByRole("listitem").count(), 0);
    await cart.getByRole("button", { name: "تراجع عن تحويل القناة" }).click();
    assert.equal(await cart.getByRole("listitem").count(), 1);
    assert.equal(await strip.getByRole("button", { name: "المطعم" }).getAttribute("aria-pressed"), "true");
    assert.deepEqual(pageErrors, [], "No client page exceptions");
    results.push({ viewport, screenshot: file, channelsConfigured: 4, channelsVisible: 2, status: "PASS" });
    await context.close();
  }
  await fs.writeFile(output + "/results.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
