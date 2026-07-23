import assert from "node:assert/strict";
import { test } from "vitest";
import { normalizeAddonsResponse } from "../src/utils/fetchAddons.ts";

test("addons response keeps backend meta categories when plans are empty", () => {
  const response = normalizeAddonsResponse({
    status: true,
    data: {
      plans: [],
      meta: {
        addonPlanCategories: [
          {
            key: "dessert",
            label: {
              ar: "اشتراك الحلى",
              en: "Dessert Subscription",
            },
          },
          {
            key: "juice",
            label: {
              ar: "اشتراك العصير",
              en: "Juice Subscription",
            },
          },
          {
            key: "meal",
            label: {
              ar: "اشتراك الوجبات",
              en: "Meal Subscription",
            },
          },
          {
            key: "small_salad",
            label: {
              ar: "اشتراك السلطة الصغيرة",
              en: "Small Salad Subscription",
            },
          },
          {
            key: "snack",
            label: {
              ar: "اشتراك السناك",
              en: "Snack Subscription",
            },
          },
        ],
      },
      summary: {
        plansCount: 0,
        matrixRowsCount: 0,
        currency: "SAR",
      },
    },
  });

  assert.equal(response.status, true);
  assert.equal(response.data.length, 0);
  assert.equal(response.summary.plansCount, 0);
  assert.equal(response.summary.matrixRowsCount, 0);
  assert.equal(response.summary.currency, "SAR");
  assert.deepEqual(
    response.meta.addonPlanCategories.map((category) => category.key),
    ["dessert", "juice", "meal", "small_salad", "snack"]
  );
});
