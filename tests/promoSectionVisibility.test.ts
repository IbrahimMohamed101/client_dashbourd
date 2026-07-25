import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("promo section stays visible immediately before subscription total", () => {
  const source = read(
    "src/components/pages/subscriptions/create/CreateSubscriptionFormContent.tsx"
  );

  const promoPosition = source.indexOf("<PromoCodeSection");
  const summaryPosition = source.indexOf("إجمالي الاشتراك");

  assert.ok(promoPosition >= 0, "promo section must always be rendered");
  assert.ok(summaryPosition >= 0, "subscription total summary must be rendered");
  assert.ok(
    promoPosition < summaryPosition,
    "promo section must remain directly before the subscription total summary"
  );
});
