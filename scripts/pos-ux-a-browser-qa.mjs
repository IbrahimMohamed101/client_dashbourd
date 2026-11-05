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
    const header = page.getByRole("banner", { name: "شريط البيع" });
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

    await firstCard.click();
    await cart.getByText("سلة المطعم").waitFor();
    assert.equal(await pay.isDisabled(), true);
    const channelButtons = page.getByRole("group", { name: "قناة البيع" });
    await channelButtons.getByRole("button", { name: "HungerStation" }).click();
    await page.getByRole("dialog", { name: "تغيير قناة البيع" }).waitFor();
    await page.getByRole("button", { name: "تأكيد تغيير القناة" }).click();
    await cart.getByText("سلة HungerStation").waitFor();
    const updatedBox = await pay.boundingBox();
    assert.ok(updatedBox && updatedBox.y + updatedBox.height <= viewport.height + 1,
      "Payment footer must remain visible after changing channel");
    assert.deepEqual(errors, [], "Unexpected client-side errors in POS");
    await page.screenshot({ path: destination + "/pos-a-" + viewport.width + "x" + viewport.height + ".png" });
    report.push({ viewport, topbar: headerBox.height, cartWidth: cartBox.width,
      firstProductY: firstCardBox.y, payBottom: updatedBox.y + updatedBox.height,
      pageOverflow: pageScroll, status: "PASS" });
    await context.close();
  }
  await fs.writeFile(destination + "/results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
