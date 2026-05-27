import assert from "node:assert/strict";
import {
  toCreateMenuOptionPayload,
  toCreateMenuProductPayload,
} from "../src/utils/menuPayloadMappers";

const localized = { ar: "ar", en: "en" };

const productPayload = toCreateMenuProductPayload({
  categoryId: "cat-1",
  key: "grilled_chicken",
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

assert.deepEqual(productPayload.availableFor, ["order", "subscription"]);
assert.equal(productPayload.availableForSubscription, true);

const optionPayload = toCreateMenuOptionPayload({
  groupId: "group-1",
  key: "salmon",
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
assert.deepEqual(optionPayload.availableFor, ["order", "subscription"]);
assert.equal(optionPayload.availableForSubscription, true);
