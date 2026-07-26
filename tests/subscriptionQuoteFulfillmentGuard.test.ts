import assert from "node:assert/strict";
import { test } from "vitest";
import { assertSubscriptionQuoteFulfillmentComplete } from "../src/utils/validateSubscriptionQuoteRequest";

test("delivery quote is blocked before the request when zoneId is missing", () => {
  assert.throws(
    () =>
      assertSubscriptionQuoteFulfillmentComplete({
        delivery: {
          type: "delivery",
          zoneId: "",
          slot: {
            type: "delivery",
            slotId: "delivery-12:00-14:00",
            window: "12:00-14:00",
          },
        },
      }),
    /منطقة التوصيل مطلوبة/
  );
});

test("delivery quote is blocked when its delivery slot is incomplete", () => {
  assert.throws(
    () =>
      assertSubscriptionQuoteFulfillmentComplete({
        delivery: {
          type: "delivery",
          zoneId: "6a621995f4f8d0974cebc472",
          slot: {
            type: "delivery",
            slotId: "",
            window: "",
          },
        },
      }),
    /فترة التوصيل مطلوبة/
  );
});

test("pickup quote is blocked when pickupLocationId is missing", () => {
  assert.throws(
    () =>
      assertSubscriptionQuoteFulfillmentComplete({
        delivery: {
          type: "pickup",
          pickupLocationId: "",
          slot: {
            type: "pickup",
            slotId: "",
            window: "",
          },
        },
      }),
    /فرع الاستلام مطلوب/
  );
});

test("complete delivery quote passes the client guard", () => {
  assert.doesNotThrow(() =>
    assertSubscriptionQuoteFulfillmentComplete({
      delivery: {
        type: "delivery",
        zoneId: "6a621995f4f8d0974cebc472",
        slot: {
          type: "delivery",
          slotId: "delivery-12:00-14:00",
          window: "12:00-14:00",
        },
      },
    })
  );
});
