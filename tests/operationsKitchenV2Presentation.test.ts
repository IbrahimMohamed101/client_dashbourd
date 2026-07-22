import assert from "node:assert/strict";
import { test } from "vitest";
import {
  buildKitchenV2Presentation,
  resolveOperationsLocalizedText,
  UNSUPPORTED_KITCHEN_MESSAGE,
} from "../src/lib/operationsKitchenV2Presentation";
import type { KitchenV2, UnifiedQueueItem } from "../src/types/dashboardOpsTypes";

function operation(kitchen: KitchenV2 | null, overrides: Partial<UnifiedQueueItem> = {}): UnifiedQueueItem {
  return {
    id: "item-1",
    entityId: "entity-1",
    entityType: "order",
    source: "one_time_order",
    type: "order",
    mode: "pickup",
    reference: "ORD-1",
    status: "in_preparation",
    statusLabel: "قيد التحضير",
    ui: { label: "قيد التحضير" },
    customer: { id: "u-1", name: "عميل", phone: "+966500000000" },
    fulfillment: { mode: "pickup", pickup: { branchName: "الفرع الرئيسي" } },
    kitchen,
    allowedActions: [],
    timestamps: { createdAt: null, updatedAt: null },
    context: { date: "2026-07-22" },
    ...overrides,
  };
}

function kitchen(overrides: Partial<KitchenV2> = {}): KitchenV2 {
  return {
    version: "v2",
    purpose: "meal_preparation",
    financialDataIncluded: false,
    mealCount: 1,
    cards: [],
    addonGroups: [],
    warnings: [],
    ...overrides,
  };
}

test("one-time direct product uses Arabic name, grams, and quantity without financial data", () => {
  const result = buildKitchenV2Presentation(
    operation(
      kitchen({
        cards: [
          {
            type: "direct_product",
            titleI18n: { ar: "دجاج 65", en: "Chicken 65" },
            quantity: 1,
            components: {
              product: {
                nameI18n: { ar: "دجاج 65", en: "Chicken 65" },
                grams: 150,
                quantity: 1,
              },
            },
          },
        ],
      })
    )
  );

  assert.equal(result.cards[0].title, "دجاج 65");
  assert.equal(result.cards[0].product?.name, "دجاج 65");
  assert.equal(result.cards[0].product?.grams, 150);
  assert.equal(result.cards[0].product?.quantity, 1);
  assert.equal(JSON.stringify(result).includes("Halala"), false);
});

test("subscription pickup meal renders protein and every carb with individual grams", () => {
  const result = buildKitchenV2Presentation(
    operation(
      kitchen({
        cards: [
          {
            type: "standard_meal",
            titleI18n: { ar: "وجبة فاهيتا" },
            components: {
              protein: { nameI18n: { ar: "فاهيتا" }, grams: 165, quantity: 1 },
              carbs: [
                {
                  nameI18n: { ar: "باستا صوص أحمر" },
                  grams: 200,
                  quantity: 1,
                },
                {
                  nameI18n: { ar: "بطاطا مشوية" },
                  grams: 100,
                  quantity: 1,
                },
              ],
            },
          },
        ],
      }),
      {
        source: "subscription_pickup_request",
        entityType: "subscription_pickup_request",
        type: "subscription_pickup_request",
        mode: "pickup",
      }
    )
  );

  assert.equal(result.cards[0].protein?.name, "فاهيتا");
  assert.equal(result.cards[0].protein?.grams, 165);
  assert.deepEqual(
    result.cards[0].carbs.map((carb) => [carb.name, carb.grams]),
    [
      ["باستا صوص أحمر", 200],
      ["بطاطا مشوية", 100],
    ]
  );
});

test("subscription delivery preserves canonical kitchen presentation", () => {
  const result = buildKitchenV2Presentation(
    operation(
      kitchen({
        cards: [
          {
            type: "standard_meal",
            titleI18n: { ar: "وجبة توصيل" },
            components: {
              protein: { nameI18n: { ar: "دجاج" }, grams: 165 },
              carbs: [{ nameI18n: { ar: "أرز" }, grams: 200 }],
            },
          },
        ],
      }),
      {
        source: "subscription",
        entityType: "subscription_day",
        type: "subscription",
        mode: "delivery",
        delivery: {
          addressSummary: "الرياض، الياسمين",
          deliveryWindow: "08:00-11:00",
        },
      }
    )
  );

  assert.equal(result.cards[0].protein?.grams, 165);
  assert.equal(result.cards[0].carbs[0].grams, 200);
});

test("add-on quantity and grams are preserved", () => {
  const result = buildKitchenV2Presentation(
    operation(
      kitchen({
        addonGroups: [
          {
            labelI18n: { ar: "مشروبات" },
            items: [
              {
                nameI18n: { ar: "عصير برتقال", en: "Orange Juice" },
                quantity: 2,
                grams: 250,
              },
            ],
          },
        ],
      })
    )
  );

  assert.equal(result.addonGroups[0].items[0].name, "عصير برتقال");
  assert.equal(result.addonGroups[0].items[0].quantity, 2);
  assert.equal(result.addonGroups[0].items[0].grams, 250);
});

test("Arabic has priority over English", () => {
  assert.equal(
    resolveOperationsLocalizedText(
      { nameI18n: { ar: "الاسم العربي", en: "English name" } },
      "مكوّن غير محدد"
    ),
    "الاسم العربي"
  );
});

test("English is a safe fallback when Arabic is missing", () => {
  assert.equal(
    resolveOperationsLocalizedText(
      { nameI18n: { ar: null, en: "English name" } },
      "مكوّن غير محدد"
    ),
    "English name"
  );
});

test("missing grams remain null and never become zero or NaN", () => {
  const result = buildKitchenV2Presentation(
    operation(
      kitchen({
        cards: [
          {
            type: "standard_meal",
            title: "وجبة",
            components: {
              protein: { name: "دجاج" },
              carbs: [{ name: "أرز", grams: 0 }],
            },
          },
        ],
      })
    )
  );

  assert.equal(result.cards[0].protein?.grams, null);
  assert.equal(result.cards[0].carbs[0].grams, null);
  assert.equal(JSON.stringify(result).includes("NaN"), false);
});

test("financial fields on the queue item never leak into Kitchen presentation", () => {
  const result = buildKitchenV2Presentation(
    operation(kitchen(), {
      pricing: {
        subtotalHalala: 1000,
        vatHalala: 150,
        discountHalala: 50,
        totalHalala: 1100,
      },
      payment: { paymentStatus: "paid", amountHalala: 1100 },
      paymentStatus: "paid",
      rawData: { payableTotalHalala: 9999 },
    })
  );
  const output = JSON.stringify(result);

  for (const forbidden of [
    "pricing",
    "payment",
    "subtotalHalala",
    "vatHalala",
    "discountHalala",
    "totalHalala",
    "payableTotalHalala",
  ]) {
    assert.equal(output.includes(forbidden), false);
  }
});

test("unsupported contract is explicit and does not reconstruct legacy items", () => {
  const unsupported = buildKitchenV2Presentation(
    operation(null, {
      items: [{ name: "Legacy item", quantity: 1 }],
      orderSummary: { mealCount: 1 },
      rawData: { kitchenDetails: { cards: [{ title: "Legacy" }] } },
    })
  );

  assert.equal(unsupported.supported, false);
  assert.equal(unsupported.unsupportedMessage, UNSUPPORTED_KITCHEN_MESSAGE);
  assert.equal(unsupported.cards.length, 0);
  assert.equal(unsupported.searchText.includes("Legacy"), false);
});
