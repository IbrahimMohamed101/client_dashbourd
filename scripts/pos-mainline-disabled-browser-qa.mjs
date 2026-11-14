import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.POS_QA_URL || "http://127.0.0.1:4173";
assert.equal(new URL(base).hostname, "127.0.0.1", "Only isolated local POS UI tests are permitted");
const evidence = process.env.POS_QA_EVIDENCE || "/tmp/basicdiet-pos-disabled";
await fs.mkdir(evidence, { recursive: true });
const user = {
  id: "synthetic-cashier", role: "cashier", name: "موظف تجريبي",
  email: "cashier@synthetic.example.test", isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const ok = data => ({ status: 200, contentType: "application/json",
  body: JSON.stringify({ status: true, data }) });
const catalog = {
  revision: 0, publishedRevision: 0,
  published: { channels: [{ id: "restaurant", label: "المطعم" }], categories: [], products: [] },
  draft: null, draftSavedBy: null, draftSavedAt: null, publishedBy: null, publishedAt: null,
};
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    let statusReads = 0, managementReads = 0, financialRequests = 0;
    page.on("pageerror", e => errors.push(e.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      const path = url.pathname, method = route.request().method();
      if (path.endsWith("/api/dashboard/auth/me")) {
        return route.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify({ status: true, token: "synthetic-qa-token", user }) });
      }
      if (path.endsWith("/api/dashboard/pos/status")) {
        statusReads += 1;
        return route.fulfill(ok({ enabled: false, environment: "production",
          financialWritesEnabled: false, reason: "POS_DISABLED" }));
      }
      if (path.endsWith("/api/dashboard/pos/catalog/manage") && method === "GET") {
        managementReads += 1;
        return route.fulfill(ok(catalog));
      }
      if (path.includes("/api/dashboard/pos/")) {
        financialRequests += 1;
        return route.fulfill({ status: 403, contentType: "application/json",
          body: JSON.stringify({ status: false, error: { code: "POS_DISABLED" } }) });
      }
      if (path.includes("/api/")) {
        return route.fulfill({ status: 403, contentType: "application/json",
          body: JSON.stringify({ status: false, error: { code: "QA_DENIED" } }) });
      }
      return route.continue();
    });
    try {
      await page.goto(base + "/pos", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "الكاشير غير مفعّل" }).waitFor({ timeout: 15000 });
      assert.ok(statusReads >= 1, "Server status must determine financial POS visibility");
      assert.equal(await page.getByRole("button", { name: /مراجعة الطلب|ابدأ طلبًا جديدًا|تسجيل مرتجع|إصدار فاتورة/ }).count(), 0);
      await page.screenshot({ path: evidence + "/disabled-" + viewport.width + ".png" });

      await page.goto(base + "/pos/menu", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "منيو الكاشير" }).waitFor({ timeout: 15000 });
      assert.ok(managementReads >= 1, "Menu must remain accessible before POS activation");
      assert.equal(financialRequests, 0, "Disabled POS must not make any financial request");
      assert.deepEqual(errors, []);
      await page.screenshot({ path: evidence + "/menu-preactivation-" + viewport.width + ".png" });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log("POS disabled view and D-098 menu preparation passed (local only)");
