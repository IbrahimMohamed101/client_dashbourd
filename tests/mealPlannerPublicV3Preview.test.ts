import assert from "node:assert/strict";
import { test } from "vitest";

import { mapMealPlannerBuilderCatalogV3 } from "../src/utils/mealPlannerMenuAdapter";

test("public Meal Planner v3 preview reads only data.builderCatalog", () => {
  const mapped = mapMealPlannerBuilderCatalogV3({
    status: true,
    data: {
      currency: "SAR",
      sections: [
        {
          id: "legacy-section",
          key: "legacy",
          products: [],
        },
      ],
      builderCatalogV2: {
        catalogVersion: "legacy",
        sections: [
          {
            id: "legacy-v2-section",
            key: "legacy_v2",
            products: [],
          },
        ],
      },
      builderCatalog: {
        contractVersion: "meal_planner_menu.v3",
        sections: [
          {
            id: "chef_choices",
            key: "chef_choices",
            name: "اختيارات الشيف",
            products: [
              {
                id: "product-1",
                key: "grilled_chicken",
                name: "دجاج مشوي",
                pricing: { priceHalala: 1500, currency: "SAR" },
              },
            ],
          },
        ],
      },
    },
  });

  assert.equal(mapped.contractVersion, "meal_planner_menu.v3");
  assert.deepEqual(
    mapped.sections.map((section) => section.key),
    ["chef_choices"]
  );
  assert.equal(mapped.sections[0].products[0].key, "grilled_chicken");
  assert.equal(mapped.legacyIncluded, false);
});

test("public Meal Planner v3 preview rejects missing builderCatalog", () => {
  assert.throws(
    () =>
      mapMealPlannerBuilderCatalogV3({
        status: true,
        data: { sections: [] },
      }),
    /missing data\.builderCatalog/
  );
});

test("public Meal Planner v3 preview rejects unexpected contract version", () => {
  assert.throws(
    () =>
      mapMealPlannerBuilderCatalogV3({
        status: true,
        data: {
          builderCatalog: {
            contractVersion: "meal_planner_menu.v2",
            sections: [],
          },
        },
      }),
    /expected meal_planner_menu\.v3/
  );
});
