import assert from "node:assert/strict";
import { buildMealBuilderVisualCards } from "../src/components/pages/menu/meal-builder/mealBuilderVisualModel";
import type { MealBuilderSection } from "../src/types/mealBuilderTypes";
import type { MenuCategory, MenuProduct } from "../src/types/menuTypes";
import { mapMealPlannerMenuResponse } from "../src/utils/mealPlannerMenuAdapter";
import { test } from "vitest";

test("mealBuilderFullMealProducts.test", () => {
  const pastaCategory = {
    id: "cat-pasta",
    key: "pasta_bechamel",
    name: { ar: "Pasta", en: "Pasta Bechamel" },
  } as MenuCategory;

  const pastaProduct = {
    id: "product-pasta",
    key: "pasta_bechamel_tray",
    name: { ar: "Pasta", en: "Pasta Bechamel Tray" },
    itemType: "pasta_bechamel",
    categoryId: pastaCategory.id,
    availableFor: ["subscription"],
    isActive: true,
    isVisible: true,
    isAvailable: true,
  } as MenuProduct;

  const sections: MealBuilderSection[] = [
    {
      sectionType: "product_category",
      sourceCategoryId: pastaCategory.id,
      selectedOptionIds: [],
      selectedProductIds: [pastaProduct.id],
      includeMode: "selected",
      selectionType: "full_meal_product",
      key: "pasta_bechamel",
      titleOverride: { ar: "Pasta", en: "Pasta Bechamel" },
      sortOrder: 2,
      required: false,
      minSelections: 0,
      maxSelections: 1,
      multiSelect: false,
      visible: true,
      availableFor: ["subscription"],
      metadata: { treatAsFullMeal: true, requiresBuilder: false },
      rules: { carbsRequired: false },
    },
  ];

  const cards = buildMealBuilderVisualCards({
    sections,
    products: [pastaProduct],
    categories: [pastaCategory],
    options: [],
    issues: [],
  });

  const pastaCard = cards.find((card) => card.key === "pasta_bechamel");
  assert.ok(pastaCard, "non-sandwich full meal section should render as its own card");
  assert.equal(pastaCard?.labelEn, "Pasta Bechamel");
  assert.equal(pastaCard?.items.length, 1);
  assert.equal(pastaCard?.items[0]?.kind, "product");
  assert.equal(
    pastaCard?.items[0]?.kind === "product" && pastaCard.items[0].treatAsFullMeal,
    true
  );
  assert.equal(
    pastaCard?.items[0]?.kind === "product" && pastaCard.items[0].requiresBuilder,
    false
  );

  const mapped = mapMealPlannerMenuResponse({
    status: true,
    data: {
      contractVersion: "meal_planner_menu.v2",
      sections: [
        {
          id: "section-pasta",
          key: "pasta_bechamel",
          type: "product_list",
          name: "Pasta Bechamel",
          products: [
            {
              id: pastaProduct.id,
              key: pastaProduct.key,
              selectionType: "full_meal_product",
              itemType: "pasta_bechamel",
              name: "Pasta Bechamel Tray",
              action: {
                type: "direct_add",
                requiresBuilder: false,
                canAddDirectly: true,
                treatAsFullMeal: true,
              },
            },
          ],
        },
      ],
    },
  });

  assert.equal(mapped.sections[0].products[0].selectionType, "full_meal_product");
  assert.equal(mapped.sections[0].products[0].action.canAddDirectly, true);
  assert.equal(mapped.sections[0].products[0].action.requiresBuilder, false);
  assert.equal(mapped.sections[0].products[0].action.treatAsFullMeal, true);
});
