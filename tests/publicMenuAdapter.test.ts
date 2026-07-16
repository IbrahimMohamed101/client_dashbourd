import assert from "node:assert/strict";
import { mapPublicMenuResponse } from "../src/utils/publicMenuAdapter";
import { publicMenuPreviewUrl } from "../src/utils/fetchPublicMenu";
import { test } from "vitest";

test("publicMenuAdapter.test", () => {
  assert.equal(
    publicMenuPreviewUrl(),
    "/api/orders/menu?includePublicV2=true"
  );

  const mapped = mapPublicMenuResponse({
    status: true,
    data: {
      publicMenuV2: {
        contractVersion: "one_time_menu.v2",
        source: "one_time_order",
        fulfillmentMethod: "pickup",
        currency: "SAR",
        vatIncluded: true,
        vatPercentage: 15,
        sections: [
          {
            id: "section-1",
            key: "meals",
            type: "product_collection",
            name: "Meals",
            ui: { cardVariant: "meal_collection" },
            products: [
              {
                id: "product-1",
                key: "steak_meal",
                itemType: "basic_meal",
                name: "Steak meal",
                pricing: {
                  model: "fixed",
                  priceHalala: 3900,
                  currency: "SAR",
                },
                action: {
                  type: "customize_optional_addons",
                  canAddDirectly: false,
                  requiresBuilder: true,
                },
                optionGroups: [
                  {
                    id: "group-1",
                    groupId: "group-1",
                    key: "extra_protein",
                    name: "Extra protein",
                    minSelections: 0,
                    maxSelections: 1,
                    isRequired: false,
                    options: [
                      {
                        id: "option-1",
                        optionId: "option-1",
                        groupId: "group-1",
                        key: "extra_steak_50g",
                        name: "Extra steak 50g",
                        extraPriceHalala: 1200,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        rules: {
          pricingUnit: "halala",
        },
      },
    },
  });

  assert.equal(mapped.contractVersion, "one_time_menu.v2");
  assert.equal(mapped.sections.length, 1);
  assert.equal(mapped.sections[0].products[0].pricing.priceHalala, 3900);
  assert.equal(mapped.sections[0].products[0].action.requiresBuilder, true);
  assert.equal(
    mapped.sections[0].products[0].optionGroups[0].options[0].extraPriceHalala,
    1200
  );
  assert.equal(mapped.productIndex.byKey.steak_meal.productId, "product-1");

  const fallback = mapPublicMenuResponse({
    status: true,
    data: {
      source: "one_time_order",
      categories: [
        {
          id: "category-1",
          key: "drinks",
          name: "Drinks",
          products: [
            {
              id: "product-2",
              key: "water",
              name: "Water",
              itemType: "drink",
              pricingModel: "fixed",
              priceHalala: 500,
              ui: { behaviorHint: "direct_add" },
            },
          ],
        },
      ],
    },
  });

  assert.equal(fallback.contractVersion, "one_time_menu.v2.frontend_fallback");
  assert.equal(fallback.sections[0].products[0].pricing.priceHalala, 500);
  assert.equal(fallback.sections[0].products[0].action.canAddDirectly, true);
});
