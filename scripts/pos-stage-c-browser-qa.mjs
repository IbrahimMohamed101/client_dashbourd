import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.POS_QA_URL || "http://127.0.0.1:4173";
assert.equal(new URL(url).hostname, "127.0.0.1", "Only local synthetic fixtures allowed");
const output = process.env.POS_QA_EVIDENCE || "/tmp/basicdiet-pos-stage-c";
await fs.mkdir(output, { recursive: true });
const user = {
  id: "synthetic-cashier-qa", role: "cashier", name: "كاشير تجريبي",
  email: "cashier@synthetic.example.test", isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const initialCatalog = {
  channels: [{ id: "restaurant", label: "المطعم" }, { id: "hungerstation", label: "HungerStation" }, { id: "keeta", label: "Keeta" }],
  categories: [{ id: "meals", label: "الوجبات" }, { id: "drinks", label: "المشروبات" }],
  products: [
    { id: "butter", name: "دجاج بالزبدة", category: "meals", active: true, variants: [
      { id: "100", label: "100 جم", prices: { restaurant: 2400, hungerstation: 2800, keeta: 2700 } },
      { id: "150", label: "150 جم", prices: { restaurant: 3200, hungerstation: 3600, keeta: 3500 } },
      { id: "200", label: "200 جم", prices: { restaurant: 3900, hungerstation: 4400, keeta: 4200 } },
    ] },
    { id: "water", name: "مياه", category: "drinks", active: false, variants: [
      { id: "bottle", label: "عبوة", prices: { restaurant: 300, hungerstation: 400, keeta: 400 } },
    ] },
  ],
};
const respond = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ status: true, data }) });
const viewports = [
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
];
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const state = { revision: 7, publishedRevision: 7, published: structuredClone(initialCatalog), draft: null };
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.route("**/*", async (route) => {
      const request = route.request();
      const address = new URL(request.url());
      if (address.hostname !== "127.0.0.1") return route.abort();
      const pathname = address.pathname;
      if (pathname.endsWith("/api/dashboard/auth/me")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: true, token: "synthetic-qa-token-not-valid", user }) });
      }
      if (pathname.endsWith("/api/dashboard/pos/catalog/manage") && request.method() === "GET") {
        return route.fulfill(respond(state));
      }
      if (pathname.endsWith("/api/dashboard/pos/catalog/draft") && request.method() === "PUT") {
        const body = request.postDataJSON();
        assert.equal(body.revision, state.revision);
        state.draft = structuredClone(body.catalog);
        state.revision += 1;
        return route.fulfill(respond(state));
      }
      if (pathname.endsWith("/api/dashboard/pos/catalog/publish") && request.method() === "POST") {
        const body = request.postDataJSON();
        assert.equal(body.revision, state.revision);
        assert.ok(state.draft, "publish requires a saved draft");
        state.published = structuredClone(state.draft);
        state.publishedRevision = ++state.revision;
        state.draft = null;
        return route.fulfill(respond(state));
      }
      if (pathname.endsWith("/api/dashboard/pos/catalog") && request.method() === "GET") {
        return route.fulfill(respond({ ...state.published, revision: state.publishedRevision }));
      }
      if (pathname.includes("/api/")) {
        return route.fulfill({ status: 403, contentType: "application/json", body: '{"status":false,"error":{"code":"QA_DENIED"}}' });
      }
      return route.continue();
    });
    try {
      await page.goto(url + "/pos/menu", { waitUntil: "domcontentloaded" });
      await page.getByRole("group", { name: "قائمة أصناف الكاشير" }).waitFor({ timeout: 14000 });
      const list = page.getByRole("group", { name: "قائمة أصناف الكاشير" });
      await page.getByRole("searchbox", { name: "بحث في أصناف الكاشير" }).fill("مياه");
      assert.equal(await list.getByRole("button", { name: /مياه/ }).count(), 1);
      await page.getByRole("button", { name: "المخفية" }).click();
      assert.equal(await list.getByRole("button", { name: /مياه/ }).count(), 1);
      await page.getByRole("button", { name: "الظاهرة" }).click();
      assert.equal(await list.getByRole("button", { name: /مياه/ }).count(), 0);
      await page.getByRole("button", { name: "الكل" }).click();
      await page.getByRole("searchbox", { name: "بحث في أصناف الكاشير" }).fill("");
      await page.getByRole("button", { name: "جدول الأسعار" }).click();
      const changes = [["100 جم", "25.00"], ["150 جم", "33.00"], ["200 جم", "40.00"]];
      for (const [size, price] of changes) {
        await page.getByRole("textbox", { name: "سعر دجاج بالزبدة " + size + " في restaurant" }).fill(price);
      }
      await page.getByRole("button", { name: "حفظ المسودة" }).click();
      await page.getByText(/مسودة محفوظة · 3 تغيير/).waitFor();
      assert.equal(state.published.products[0].variants[0].prices.restaurant, 2400, "Draft must not affect cashier until publish");
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "مراجعة ونشر" }).click();
      const review = page.getByRole("region", { name: "مراجعة تغييرات منيو الكاشير" });
      await review.getByText("24.00 ر.س").waitFor();
      assert.equal(await review.getByRole("row").count(), 4);
      const rect = await review.boundingBox();
      assert.ok(rect && rect.width <= viewport.width, "Catalog review must fit the viewport");
      await page.screenshot({ path: output + "/review-" + viewport.width + "x" + viewport.height + ".png" });
      await page.getByRole("button", { name: "نشر المنيو" }).click();
      assert.equal(state.published.products[0].variants[0].prices.restaurant, 2500, "Published price should change only after publish");
      await page.getByText("المنيو المنشور هو الظاهر للكاشير").waitFor();
      assert.deepEqual(errors, []);
    } catch (error) {
      console.error("Stage C QA diagnostic", { viewport, errors, url: page.url(), body: (await page.locator("body").innerText()).slice(0, 1000) });
      await page.screenshot({ path: output + "/failed-" + viewport.width + "x" + viewport.height + ".png" });
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log("POS Stage C catalog save/review/publish passed at all four viewports with synthetic data only");
