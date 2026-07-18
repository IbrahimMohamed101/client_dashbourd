import assert from "node:assert/strict";
import { test } from "vitest";

import { isMealBuilderCandidateSelectable } from "../src/components/pages/menu/meal-builder/mealBuilderFrontendUtils";
import type {
  MealBuilderPickerCandidate,
  MealBuilderPickerResponseData,
} from "../src/types/mealBuilderTypes";

function candidate(
  overrides: Partial<MealBuilderPickerCandidate>
): MealBuilderPickerCandidate {
  return {
    id: overrides.id ?? "product-1",
    productId: overrides.productId ?? overrides.id ?? "product-1",
    type: "product",
    key: overrides.key ?? "product_key",
    name: overrides.name ?? { ar: "منتج", en: "Product" },
    label: overrides.label ?? "منتج",
    itemType: overrides.itemType ?? "full_meal_product",
    categoryId: overrides.categoryId ?? "cat-1",
    categoryKey: overrides.categoryKey ?? "meals",
    category: overrides.category ?? {
      id: "cat-1",
      key: "meals",
      name: { ar: "وجبات", en: "Meals" },
    },
    selectionType: overrides.selectionType ?? "full_meal_product",
    configurable: overrides.configurable ?? false,
    pricing: overrides.pricing ?? {
      pricingModel: "fixed",
      priceHalala: 1250,
      currency: "SAR",
    },
    selected: overrides.selected ?? false,
    assigned: overrides.assigned ?? false,
    assignedSectionKey: overrides.assignedSectionKey ?? null,
    assignable: overrides.assignable ?? true,
    required: overrides.required ?? false,
    eligible: overrides.eligible ?? true,
    linked: overrides.linked ?? true,
    available: overrides.available ?? true,
    active: overrides.active ?? true,
    visible: overrides.visible ?? true,
    published: overrides.published ?? true,
    subscriptionEnabled: overrides.subscriptionEnabled ?? true,
    relationExists: overrides.relationExists ?? true,
    catalogItemAvailable: overrides.catalogItemAvailable ?? true,
    reasonCodes: overrides.reasonCodes ?? ["ELIGIBLE"],
    warnings: overrides.warnings ?? [],
    errors: overrides.errors ?? [],
    state: overrides.state ?? "eligible",
    sortOrder: overrides.sortOrder ?? 1,
  };
}

test("picker candidate selection is backend-authoritative", () => {
  const selectedButNotAssignable = candidate({
    selected: true,
    assignable: false,
    state: "selected",
    reasonCodes: ["SELECTED"],
  });
  const assignedElsewhere = candidate({
    selected: false,
    assigned: true,
    assignable: false,
    assignedSectionKey: "other_card",
    state: "assigned_elsewhere",
    reasonCodes: ["ASSIGNED_TO_OTHER_CARD"],
  });
  const unavailableButLocallyLooksGood = candidate({
    assignable: false,
    active: true,
    visible: true,
    published: true,
    subscriptionEnabled: true,
    state: "unavailable",
    reasonCodes: ["PRODUCT_UNAVAILABLE"],
  });

  assert.equal(isMealBuilderCandidateSelectable(selectedButNotAssignable), true);
  assert.equal(isMealBuilderCandidateSelectable(assignedElsewhere), false);
  assert.equal(isMealBuilderCandidateSelectable(unavailableButLocallyLooksGood), false);
});

test("picker contract includes required metadata and state fields", () => {
  const response: MealBuilderPickerResponseData = {
    contractVersion: "dashboard_meal_builder_picker.v1",
    sectionKey: "secondary_card",
    targetSectionKey: "secondary_card",
    candidateType: "product",
    category: null,
    rules: {
      source: "menu_products",
      uniquenessScope: "current_draft",
    },
    candidates: [
      candidate({ selected: true, state: "selected" }),
      candidate({
        id: "product-2",
        productId: "product-2",
        selected: false,
        assigned: true,
        assignable: false,
        state: "assigned_elsewhere",
      }),
    ],
    meta: {
      page: 1,
      limit: 1000,
      total: 2,
      pages: 1,
      catalogTotal: 4,
      selectedInCurrentCard: 1,
      assignedToOtherCards: 1,
      unassigned: 1,
      unavailable: 0,
    },
  };

  assert.equal(response.contractVersion, "dashboard_meal_builder_picker.v1");
  assert.equal(response.meta?.limit, 1000);
  assert.equal(response.meta?.assignedToOtherCards, 1);
  assert.equal(response.candidates[0].selected, true);
  assert.equal(response.candidates[1].state, "assigned_elsewhere");
});
