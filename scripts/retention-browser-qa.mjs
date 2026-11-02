import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base = process.env.RETENTION_QA_DASHBOARD_URL || "http://127.0.0.1:5173";
const backend = process.env.RETENTION_QA_BACKEND_URL || "http://127.0.0.1:3000";
// This runner is intentionally restricted to disposable local fixtures.
for (const url of [base, backend]) assert.equal(new URL(url).hostname, "127.0.0.1");
const evidence = process.env.RETENTION_QA_EVIDENCE_DIR || "/tmp/retention-browser-evidence";
await fs.mkdir(evidence, { recursive: true });
const identity = await fetch(backend + "/__retention_qa__/identity").then((r) => r.json());
assert.equal(identity.mode, "synthetic_disposable_retention_qa", "Start the isolated backend QA server before running browser checks");
const browser = await chromium.launch({ headless: true });
const results = [];
let lastPage;
const apiPath = "/api/dashboard/customer-management/retention";
try {
  for (const [device, viewport, customerName] of [
    ["desktop", { width: 1440, height: 1000 }, "عميل اختبار التجديد"],
    ["mobile", { width: 390, height: 844 }, "عميل صناعي 2"],
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    lastPage = page;
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      const safeMutation = route.request().method() === "GET" || route.request().method() === "OPTIONS"
        || /\/auth\/login$|\/retention\/[^/]+\/followups$/.test(url.pathname);
      return ["127.0.0.1", "localhost"].includes(url.hostname) && safeMutation ? route.continue() : route.abort();
    });
    await page.goto(base + "/?redirect=/customer-management");
    await page.getByLabel("البريد الإلكتروني").fill("superadmin@retention.example.test");
    await page.getByLabel("كلمة المرور").fill("SyntheticQa123!");
    await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
    await page.getByText("متابعة اشتراكات العملاء — الحالة الحالية", { exact: true }).waitFor();
    await page.getByRole("button", { name: "التالي", exact: true }).click();
    await page.getByRole("button", { name: "السابق", exact: true }).click();
    await page.getByLabel("بحث باسم أو رقم جوال").fill(customerName);
    await page.getByRole("button", { name: "بحث", exact: true }).click();
    const row = page.getByRole("row").filter({ has: page.getByText(customerName, { exact: true }) });
    await row.waitFor();
    // Search may match another synthetic numbered fixture; select exact row.
    await row.getByRole("link", { name: "ملف العميل" }).click();
    await page.getByRole("heading", { name: "إدارة بيانات العملاء", exact: true }).waitFor();
    await page.getByRole("tab", { name: "متابعة التجديدات الحالية" }).click();
    await page.getByLabel("بحث باسم أو رقم جوال").fill(customerName);
    await page.getByRole("button", { name: "بحث", exact: true }).click();
    await row.getByRole("button", { name: "تسجيل متابعة", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText("لم تُسجل متابعة سابقة.").waitFor();
    await dialog.getByLabel("النتيجة", { exact: true }).selectOption("not_interested");
    await dialog.getByLabel("سبب عدم التجديد حسب كلام العميل").selectOption("price");
    const note = "ملاحظة اختبار صناعية " + device;
    await dialog.getByLabel("ملاحظات الموظف (بدون بيانات حساسة)").fill(note);
    const capturedRequest = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/followups"));
    await dialog.getByRole("button", { name: "حفظ المتابعة" }).click();
    const original = await capturedRequest;
    await dialog.getByRole("status").waitFor();
    assert.equal(await dialog.getByRole("button", { name: "حفظ المتابعة" }).isDisabled(), true);
    const token = (await context.cookies()).find((c) => c.name === "dashboardToken").value;
    const headers = { Authorization: "Bearer " + token };
    const replay = await context.request.post(original.url(), { headers, data: original.postDataJSON() });
    assert.equal(replay.status(), 200);
    assert.equal((await replay.json()).meta.replayed, true);
    await dialog.getByRole("button", { name: "إغلاق", exact: true }).click();
    await page.reload();
    await page.getByRole("tab", { name: "متابعة التجديدات الحالية" }).click();
    await page.getByLabel("بحث باسم أو رقم جوال").fill(customerName);
    await page.getByRole("button", { name: "بحث", exact: true }).click();
    await row.getByRole("button", { name: "تسجيل متابعة", exact: true }).click();
    await dialog.getByText(note, { exact: true }).waitFor();
    const history = await context.request.get(original.url(), { headers });
    assert.equal((await history.json()).data.length, 1);
    await dialog.getByLabel("النتيجة", { exact: true }).selectOption("do_not_contact");
    await dialog.getByRole("button", { name: "حفظ المتابعة" }).click();
    await dialog.getByText(/العميل طلب عدم التواصل/).waitFor();
    assert.equal(await dialog.getByRole("button", { name: "حفظ المتابعة" }).isDisabled(), true);
    await page.screenshot({ path: evidence + "/" + device + "-followup.png", fullPage: true });
    await dialog.getByRole("button", { name: "إغلاق", exact: true }).click();
    await page.reload();
    await page.getByRole("tab", { name: "متابعة التجديدات الحالية" }).click();
    await page.getByLabel("بحث باسم أو رقم جوال").fill(customerName);
    await page.getByRole("button", { name: "بحث", exact: true }).click();
    await row.getByText("طلب عدم التواصل", { exact: true }).waitFor();
    const contactable = await context.request.get(backend + apiPath + "?contactableOnly=true&search=" + encodeURIComponent(customerName), { headers });
    assert.ok((await contactable.json()).data.rows.every((r) => !r.doNotContact));
    await page.getByRole("button", { name: "بعد مهلة 14 يومًا" }).click();
    await page.getByText("لا توجد نتائج لهذا البحث.").waitFor();
    await page.getByRole("button", { name: "مسح", exact: true }).click();
    await page.getByRole("tab", { name: "تدقيق أكتوبر 2026" }).click();
    await page.getByText(/18:00:53/).first().waitFor();
    await page.screenshot({ path: evidence + "/" + device + "-october.png", fullPage: true });
    await page.getByRole("tab", { name: "متابعة التجديدات الحالية" }).click();
    await page.route("**/customer-management/retention?**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":{"code":"QA_UNAVAILABLE"}}' }));
    await page.getByRole("button", { name: "تحديث البيانات" }).click();
    await page.getByRole("alert").filter({ hasText: "تعذر تحميل بيانات التجديدات" }).waitFor();
    assert.equal(await page.getByRole("table").count(), 0, "Failed refetch must not expose cached customer rows");
    assert.equal(await page.locator('section[aria-label="التجديدات الحالية"]').getAttribute("dir"), "rtl");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "No page-level mobile overflow");
    assert.deepEqual(errors, []);
    results.push({ device, login: "PASS", listSearchFilterPagination: "PASS", profile: "PASS", followupReplayRefresh: "PASS", doNotContact: "PASS", october: "PASS", errorAndRTL: "PASS" });
    await context.close();
  }
  const context = await browser.newContext();
  const anonymous = await context.request.get(backend + apiPath);
  assert.equal(anonymous.status(), 401);
  for (const role of ["admin", "restaurant", "kitchen", "courier", "cashier"]) {
    const login = await context.request.post(backend + "/api/dashboard/auth/login", { data: { email: role + "@retention.example.test", password: "SyntheticQa123!" } });
    const auth = await login.json();
    assert.equal(login.status(), 200);
    const response = await context.request.get(backend + apiPath, { headers: { Authorization: "Bearer " + auth.token } });
    assert.equal(response.status(), 403);
    assert.equal((await response.json()).data, undefined);
    const page = await context.newPage();
    lastPage = page;
    await context.clearCookies();
    await context.addCookies([{ name: "dashboardToken", value: auth.token, url: base }]);
    let retentionRequests = 0;
    page.on("request", (request) => { if (request.url().includes(apiPath)) retentionRequests++; });
    await page.goto(base + "/customer-management");
    await page.waitForURL((url) => !url.pathname.startsWith("/customer-management"));
    assert.equal(retentionRequests, 0);
    await page.close();
  }
  await context.close();
  results.push({ anonymous: "401 PASS", allNonSuperadminRoles: "403 + UI redirect PASS" });
  await fs.writeFile(evidence + "/results.json", JSON.stringify({ isolated: true, syntheticOnly: true, results }, null, 2));
  console.log(JSON.stringify(results));
} catch (error) {
  if (lastPage && !lastPage.isClosed()) {
    await lastPage.screenshot({ path: evidence + "/failure.png", fullPage: true });
    console.error("Synthetic QA page:", (await lastPage.locator("body").innerText()).slice(0, 2500));
  }
  throw error;
} finally { await browser.close(); }
