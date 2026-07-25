import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";
import type { CreateSubscriptionSchemaType } from "../src/lib/validations/createSubscriptionSchema";
import {
  buildSubscriptionCreationPayload,
  buildSubscriptionQuotePayload,
} from "../src/utils/buildSubscriptionCreationPayload";
import { canRoleAccessRoute } from "../src/constants/routes";
import { UserRoles } from "../src/types/auth";

function values(promoCode: string): CreateSubscriptionSchemaType {
  return {
    userId: "6a6499709c57bb67aa711701",
    planId: "6a621995f4f8d0974cebc472",
    grams: 150,
    mealsPerDay: 3,
    startDate: "2026-07-26",
    promoCode,
    premiumItems: [],
    addons: [],
    delivery: {
      type: "pickup",
      zoneId: "",
      pickupLocationId: "main",
      address: {
        label: "",
        city: "",
        district: "",
        street: "",
        building: "",
      },
      slot: {
        type: "pickup",
        window: "",
        slotId: "",
      },
    },
    paymentMethod: "cash",
  };
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("subscription promo code is sent in quote and create payloads", () => {
  const quote = buildSubscriptionQuotePayload(values(" welcome20 "));
  const create = buildSubscriptionCreationPayload(values(" welcome20 "));

  assert.equal(quote.promoCode, "WELCOME20");
  assert.equal("payment" in quote, false);
  assert.equal(create.promoCode, "WELCOME20");
  assert.deepEqual(create.payment, { method: "cash" });
});

test("empty promo code is omitted", () => {
  const quote = buildSubscriptionQuotePayload(values("   "));
  const create = buildSubscriptionCreationPayload(values(""));

  assert.equal("promoCode" in quote, false);
  assert.equal("promoCode" in create, false);
});

test("restaurant create-subscription screen applies promo before payment summary", () => {
  const formSource = read(
    "src/components/pages/subscriptions/create/CreateSubscriptionFormContent.tsx"
  );
  const promoSource = read(
    "src/components/pages/subscriptions/create/PromoCodeSection.tsx"
  );
  const planSource = read(
    "src/components/pages/subscriptions/create/PlanSelectionSection.tsx"
  );

  assert.equal(
    canRoleAccessRoute(UserRoles.RESTAURANT, "/users/user-1/create-subscription"),
    true
  );
  assert.match(promoSource, /كود الخصم/);
  assert.match(promoSource, /تطبيق الكود/);
  assert.match(promoSource, /fetchSubscriptionQuote/);
  assert.doesNotMatch(planSource, /تطبيق الكود/);

  const promoPosition = formSource.indexOf("<PromoCodeSection");
  const summaryPosition = formSource.indexOf("إجمالي الاشتراك");
  assert.ok(promoPosition >= 0, "promo section must be rendered");
  assert.ok(summaryPosition >= 0, "payment summary must be rendered");
  assert.ok(
    promoPosition < summaryPosition,
    "promo section must appear immediately before the payment summary"
  );

  assert.match(formSource, /السعر قبل الخصم/);
  assert.match(formSource, /قيمة الخصم/);
  assert.match(formSource, /السعر بعد الخصم/);
  assert.match(formSource, /promoQuote \?/);
});
