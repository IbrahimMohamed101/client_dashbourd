import assert from "node:assert/strict";
import {
  toCreateMenuCategoryPayload,
  toCreateMenuOptionGroupPayload,
  toCreateMenuOptionPayload,
  toCreateMenuProductPayload,
  toUpdateSelectionRulesPayload,
} from "../src/utils/menuPayloadMappers";
import menuProductSchema from "../src/lib/validations/menuProductSchema";

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
  availableFor: ["order", "subscription"],
  availableForSubscription: true,
  sortOrder: 0,
});

assert.equal("key" in productPayload, true);
assert.equal(productPayload.key, undefined);
assert.deepEqual(productPayload.availableFor, ["one_time", "subscription"]);
assert.equal(productPayload.availableForSubscription, true);

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

assert.equal(optionPayload.displayCategoryKey, "protein");
assert.equal("displayCategory" in optionPayload, false);
assert.equal(optionPayload.key, undefined);
assert.deepEqual(optionPayload.availableFor, ["one_time", "subscription"]);
assert.equal(optionPayload.availableForSubscription, true);

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
assert.equal(productDefaults.ui.imageRatio, "square");
assert.equal(productDefaults.ui.cardVariant, "standard");

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
assert.equal(categoryPayload.ui?.cardVariant, "addon_collection");

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
