import assert from "node:assert/strict";
import { normalizeProductDetailResponse } from "../src/utils/menuResponseNormalizers";

const response = normalizeProductDetailResponse({
  status: true,
  data: {
    id: "product-1",
    categoryId: "category-1",
    key: "grilled-chicken",
    itemType: "product",
    name: { ar: "دجاج مشوي", en: "Grilled Chicken" },
    description: { ar: "", en: "" },
    image: "https://cdn.example.com/product.jpg",
    pricingModel: "fixed",
    priceHalala: 2500,
    isActive: true,
    isAvailable: true,
    availableFor: ["one_time", "subscription"],
    sortOrder: 0,
  },
});

assert.equal(response.data.imageUrl, "https://cdn.example.com/product.jpg");

const nestedAlternateProduct = normalizeProductDetailResponse({
  status: true,
  data: {
    _id: "product-2",
    category: { _id: "category-2", name: { ar: "تصنيف", en: "Category" } },
    key: "fruit-bowl",
    type: "fruit_salad",
    name: { ar: "سلطة فواكه", en: "Fruit salad" },
    pricingModel: "fixed",
    priceHalala: 1800,
    isActive: true,
    isAvailable: true,
    sortOrder: 3,
  },
});

assert.equal(nestedAlternateProduct.data.categoryId, "category-2");
assert.equal(nestedAlternateProduct.data.itemType, "fruit_salad");

const legacyBlankFieldsProduct = normalizeProductDetailResponse({
  status: true,
  data: {
    _id: "product-3",
    categoryId: "",
    category: { id: "category-3" },
    itemType: "",
    type: "drink",
    name: { ar: "مياه", en: "Water" },
    pricingModel: "fixed",
    priceHalala: 500,
    isActive: true,
    isAvailable: true,
    sortOrder: 1,
  },
});

assert.equal(legacyBlankFieldsProduct.data.categoryId, "category-3");
assert.equal(legacyBlankFieldsProduct.data.itemType, "drink");

const legacySarPriceProduct = normalizeProductDetailResponse({
  status: true,
  data: {
    _id: "product-4",
    categoryId: "category-4",
    itemType: "dessert",
    name: { ar: "كيك", en: "Cake" },
    pricingModel: "fixed",
    price: 25,
    active: false,
    available: false,
    visible: false,
    base_unit_grams: 100,
    default_weight_grams: 150,
    min_weight_grams: 50,
    max_weight_grams: 300,
    weight_step_grams: 25,
    ui: {
      card_variant: "addon",
      cta_label: "Add",
      image_ratio: "4/3",
    },
    sort_order: 9,
  },
});

assert.equal(legacySarPriceProduct.data.priceHalala, 2500);
assert.equal(legacySarPriceProduct.data.isActive, false);
assert.equal(legacySarPriceProduct.data.isAvailable, false);
assert.equal(legacySarPriceProduct.data.isVisible, false);
assert.equal(legacySarPriceProduct.data.baseUnitGrams, 100);
assert.equal(legacySarPriceProduct.data.defaultWeightGrams, 150);
assert.equal(legacySarPriceProduct.data.minWeightGrams, 50);
assert.equal(legacySarPriceProduct.data.maxWeightGrams, 300);
assert.equal(legacySarPriceProduct.data.weightStepGrams, 25);
assert.equal(legacySarPriceProduct.data.ui?.cardVariant, "addon");
assert.equal(legacySarPriceProduct.data.ui?.ctaLabel, "Add");
assert.equal(legacySarPriceProduct.data.ui?.imageRatio, "4/3");
