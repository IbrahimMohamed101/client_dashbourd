import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("promo section is below delivery and immediately before the final total", () => {
  const source = read(
    "src/components/pages/subscriptions/create/CreateSubscriptionFormContent.tsx"
  );

  const deliveryPosition = source.indexOf("<DeliverySection form={form} />");
  const promoPosition = source.indexOf("<PromoCodeSection");
  const summaryPosition = source.indexOf("<h2 className=\"font-semibold\">إجمالي الاشتراك</h2>");

  assert.ok(deliveryPosition >= 0);
  assert.ok(promoPosition > deliveryPosition);
  assert.ok(summaryPosition > promoPosition);
});

test("plan selection no longer contains the promo input", () => {
  const source = read(
    "src/components/pages/subscriptions/create/PlanSelectionSection.tsx"
  );

  assert.equal(source.includes("promo-code"), false);
  assert.equal(source.includes("تطبيق الكود"), false);
});

test("payment summary renders one authoritative final price", () => {
  const source = read(
    "src/components/pages/subscriptions/create/CreateSubscriptionFormContent.tsx"
  );

  assert.match(source, /data-testid="final-subscription-total"/);
  assert.match(source, /promoQuote\?\.totalHalala \?\? totalHalala/);
  assert.match(source, /الإجمالي النهائي بعد خصم/);
  assert.equal(source.includes("السعر قبل الخصم"), false);
  assert.equal(source.includes("قيمة الخصم —"), false);
  assert.equal(source.includes('label="سعر الباقة"'), false);
});

test("promo success state does not repeat monetary totals", () => {
  const source = read(
    "src/components/pages/subscriptions/create/PromoCodeSection.tsx"
  );

  assert.match(source, /السعر النهائي ظاهر في الملخص بالأسفل/);
  assert.equal(source.includes("الإجمالي بعد الخصم:"), false);
  assert.equal(source.includes("الخصم:"), false);
});

test("dashboard sends promo code but never sends a client-computed total", () => {
  const source = read("src/utils/buildSubscriptionCreationPayload.ts");

  assert.match(source, /promoCode/);
  assert.equal(source.includes("totalHalala:"), false);
  assert.equal(source.includes("discountHalala:"), false);
});
