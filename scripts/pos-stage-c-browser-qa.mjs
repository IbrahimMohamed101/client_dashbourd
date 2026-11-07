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
    { id: "butter", name: "دجاج بالزبدة", category: "meals", active: true, hasAddons: true, variants: [
      { id: "100", label: "100 جم", prices: { restaurant: 2400, hungerstation: 2800, keeta: 2700 } },
      { id: "150", label: "150 جم", prices: { restaurant: 3200, hungerstation: 3600, keeta: 3500 } },
      { id: "200", label: "200 جم", prices: { restaurant: 3900, hungerstation: 4400, keeta: null } },
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
      // Wait for the containing Radix dialog's entry animation before comparing
      // the region and its last cell; otherwise their rectangles are captured at
      // different transform progress and can spuriously look clipped.
      await review.evaluate(async (element) => {
        const dialog = element.closest('[data-slot="dialog-content"]');
        if (dialog) {
          await Promise.all(dialog.getAnimations().map((animation) =>
            animation.finished.catch(() => undefined)));
        }
      });
      const rect = await review.boundingBox();
      assert.ok(rect && rect.width <= viewport.width, "Catalog review must fit the viewport");
      const afterCell = review.getByRole("row").nth(1).getByRole("cell").last();
      const afterRect = await afterCell.boundingBox();
      assert.ok(afterRect && afterRect.x >= rect.x - 1
        && afterRect.x + afterRect.width <= rect.x + rect.width + 1,
        "The AFTER price column must be wholly visible without horizontal scroll");
      await page.screenshot({ path: output + "/review-" + viewport.width + "x" + viewport.height + ".png" });
      await page.getByRole("button", { name: "نشر المنيو" }).click();
      assert.equal(state.published.products[0].variants[0].prices.restaurant, 2500, "Published price should change only after publish");
      await page.getByText("المنيو المنشور هو الظاهر للكاشير").waitFor();

      // Phase D: show the full multi-channel matrix; only filtered rows are copied.
      await page.getByRole("button", { name: "جدول الأسعار" }).click();
      await page.getByRole("checkbox", { name: "عرض كل القنوات" }).check();
      assert.equal(await page.getByRole("textbox", { name: "سعر دجاج بالزبدة 100 جم في keeta" }).inputValue(), "27.00");
      await page.getByRole("searchbox", { name: "بحث في جدول أسعار الكاشير" }).fill("دجاج بالزبدة");
      await page.getByRole("button", { name: "نسخ أسعار قناة" }).click();
      await page.getByRole("combobox", { name: "طريقة نسخ الأسعار" }).selectOption("overwrite");
      await page.getByText(/3 سعر سيتغير/).waitFor();
      await page.getByRole("button", { name: "تطبيق على المسودة" }).click();
      assert.equal(state.published.products[0].variants[0].prices.hungerstation, 2800,
        "Bulk copy must not alter published prices before saving and publishing");
      await page.getByRole("button", { name: "حفظ المسودة" }).click();
      await page.getByText(/مسودة محفوظة · 3 تغيير/).waitFor();
      await page.getByRole("button", { name: "مراجعة ونشر" }).click();
      const phaseDReview = page.getByRole("region", { name: "مراجعة تغييرات منيو الكاشير" });
      assert.equal(await phaseDReview.getByRole("row").count(), 4);
      await page.getByRole("button", { name: "نشر المنيو" }).click();
      for (let wait = 0; wait < 50
        && state.published.products[0].variants[0].prices.hungerstation !== 2500; wait += 1) {
        await page.waitForTimeout(50);
      }
      assert.equal(state.published.products[0].variants[0].prices.hungerstation, 2500);
      assert.equal(state.published.products[1].variants[0].prices.hungerstation, 400,
        "Filtered price copy must leave water untouched");
      assert.equal(state.published.products[0].variants[0].prices.keeta, 2700,
        "Cross-channel copy must not alter Keeta");
      assert.equal(state.published.products[0].variants[2].prices.keeta, null,
        "An unpriced Keeta size must remain unavailable without explicit consent");
      await page.getByRole("button", { name: "جدول الأسعار" }).click();
      await page.getByRole("button", { name: "نسخ أسعار قناة" }).click();
      await page.getByRole("combobox", { name: "قناة وجهة الأسعار" }).selectOption("keeta");
      await page.getByText(/1 حجم غير مسعّر لن يتاح/).waitFor();
      assert.equal(await page.getByRole("button", { name: "تطبيق على المسودة" }).isDisabled(), true,
        "Default copy must not list an unpriced size for sale");
      await page.getByRole("checkbox", { name: "الموافقة على إتاحة أحجام غير مسعرة" }).check();
      await page.getByRole("button", { name: "تطبيق على المسودة" }).click();
      assert.equal(state.published.products[0].variants[2].prices.keeta, null,
        "Even approved new prices require save and publish");

      // Phase D: clones are independent, hidden and preserve explicit addon rules.
      await page.getByRole("button", { name: "تعديل صنف" }).click();
      await page.getByRole("button", { name: "نسخ الصنف كمسودة مخفية" }).click();
      assert.equal(await page.getByRole("textbox", { name: "اسم الصنف" }).inputValue(), "نسخة من دجاج بالزبدة");
      assert.equal(await page.getByRole("checkbox", { name: "يظهر في الكاشير بعد النشر" }).isChecked(), false);
      await page.getByRole("button", { name: "منع كل الإضافات" }).click();
      await page.getByRole("button", { name: "حفظ المسودة" }).click();
      await page.getByRole("button", { name: "مراجعة ونشر" }).click();
      await page.getByRole("button", { name: "نشر المنيو" }).click();
      const duplicated = state.published.products.find((item) => item.name === "نسخة من دجاج بالزبدة");
      assert.ok(duplicated && duplicated.active === false, "Copied item must be hidden until explicitly enabled");
      assert.deepEqual(duplicated.allowedAddonIds, []);
      assert.notEqual(duplicated.variants[0].id, state.published.products[0].variants[0].id);
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
console.log("POS Stages C+D price matrix, bulk copy, hidden clone and publish passed on four viewports with synthetic data only");
