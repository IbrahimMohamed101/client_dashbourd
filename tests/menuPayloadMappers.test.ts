import assert from "node:assert/strict";
import {
  parseOptionalSelectionLimit,
  toCreateMenuCategoryPayload,
  toCreateMenuOptionGroupPayload,
  toCreateMenuOptionPayload,
  toCreateMenuProductPayload,
  toUpdateMenuOptionPayload,
  toUpdateSelectionRulesPayload,
} from "../src/utils/menuPayloadMappers";
import menuProductSchema from "../src/lib/validations/menuProductSchema";
import { test } from "vitest";

test("menuPayloadMappers.test", () => {
  const localized = { ar: "ar", en: "en" };

  const productPayload = toCreateMenuProductPayload({
    categoryId: "cat-1",
    key: "",
    itemType: "basic_meal",
    name: localized,
    description: localized,
    imageUrl: "",
    pricingModel: "fixed",
    priceSar: 25,
    isActive: true,
    isAvailable: true,
    isVisible: true,
    isCustomizable: false,
    availableFor: ["order", "subscription"],
    ui: { cardSize: "medium" },
    sortOrder: 0,
  });

  assert.equal(productPayload.key, undefined);
  assert.deepEqual(productPayload.availableFor, ["one_time", "subscription"]);
  assert.equal(productPayload.isCustomizable, false);
  assert.deepEqual(productPayload.ui, { cardSize: "medium" });
  assert.equal("key" in productPayload, false);

  const optionPayload = toCreateMenuOptionPayload({
    groupId: "group-1",
    key: "",
    name: localized,
    description: localized,
    imageUrl: "",
    extraPriceSar: 7.5,
    extraWeightUnitGrams: 100,
    extraWeightPriceSar: 3,
    displayCategoryKey: "protein",
    availableFor: ["order", "subscription"],
    availableForSubscription: true,
    isActive: true,
    isAvailable: true,
    isVisible: true,
    sortOrder: 0,
  });

  assert.equal(optionPayload.displayCategoryKey, undefined);
  assert.equal("displayCategory" in optionPayload, false);
  assert.equal(optionPayload.key, undefined);
  assert.equal("key" in optionPayload, false);
  assert.deepEqual(optionPayload.availableFor, ["one_time", "subscription"]);
  assert.equal(optionPayload.availableForSubscription, true);

  const optionUpdatePayload = toUpdateMenuOptionPayload({
    ...optionPayload,
    key: "",
    extraPriceSar: 0,
    extraWeightPriceSar: 0,
    premiumKey: "",
    extraFeeSar: 0,
    ruleTags: "",
    selectionType: "",
  });

  assert.equal(optionUpdatePayload.premiumKey, undefined);
  assert.equal(optionUpdatePayload.selectionType, undefined);
  assert.equal(optionUpdatePayload.extraFeeHalala, 0);
  assert.equal(optionUpdatePayload.ruleTags, undefined);

  const productDefaults = menuProductSchema.parse({
    categoryId: "cat-1",
    itemType: "drink",
    name: localized,
    description: localized,
    pricingModel: "fixed",
    priceSar: 1,
    sortOrder: 0,
  });

  assert.deepEqual(productDefaults.availableFor, ["one_time", "subscription"]);
  assert.equal(productDefaults.ui.cardSize, "medium");

  const categoryPayload = toCreateMenuCategoryPayload({
    key: "",
    name: localized,
    description: localized,
    imageUrl: "",
    isActive: true,
    isAvailable: true,
    isVisible: true,
    ui: { cardVariant: "addon_collection" },
    sortOrder: 0,
  });

  assert.equal(categoryPayload.key, undefined);
  assert.equal("key" in categoryPayload, false);
  assert.equal(categoryPayload.ui, undefined);

  const optionGroupPayload = toCreateMenuOptionGroupPayload({
    key: "",
    name: localized,
    description: localized,
    isActive: true,
    isAvailable: true,
    isVisible: true,
    ui: { displayStyle: "radio_cards" },
    sortOrder: 0,
  });

  assert.equal(optionGroupPayload.key, undefined);
  assert.equal("key" in optionGroupPayload, false);
  assert.equal(optionGroupPayload.ui?.displayStyle, "radio_cards");

  assert.deepEqual(
    toUpdateSelectionRulesPayload({
      minSelections: "1",
      maxSelections: "2",
      isRequired: true,
      sortOrder: "5",
    }),
    {
      minSelections: 1,
      maxSelections: 2,
      isRequired: true,
      sortOrder: 5,
    }
  );

  assert.deepEqual(
    toUpdateSelectionRulesPayload({
      minSelections: "0",
      maxSelections: "0",
      isRequired: false,
      sortOrder: "0",
    }),
    {
      minSelections: 0,
      maxSelections: 0,
      isRequired: false,
      sortOrder: 0,
    }
  );

  assert.equal(parseOptionalSelectionLimit(""), null);
  assert.equal(parseOptionalSelectionLimit("0"), 0);
});
