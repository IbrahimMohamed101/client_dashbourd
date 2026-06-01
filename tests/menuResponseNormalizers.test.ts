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
