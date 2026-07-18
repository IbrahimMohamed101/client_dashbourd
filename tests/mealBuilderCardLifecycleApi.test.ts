import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/apis", () => ({
  default: apiMock,
}));

import {
  addMealBuilderProducts,
  assertMealBuilderCardActionResponse,
  createMealBuilderProductSection,
  deleteMealBuilderProductSection,
  getExistingDirectCardProductPicker,
  getNewDirectCardProductPicker,
  removeMealBuilderProduct,
  updateMealBuilderProductSection,
} from "../src/utils/fetchMealBuilder";
import type {
  MealBuilderCardActionResponse,
  MealBuilderConfig,
  MealBuilderValidation,
} from "../src/types/mealBuilderTypes";

const draft: MealBuilderConfig = {
  id: "draft-1",
  status: "draft",
  isCurrent: true,
  contractVersion: "dashboard_meal_builder.v1",
  revisionHash: "hash",
  source: "dashboard",
  createdBySystem: false,
  bootstrapKey: "default",
  publishedAt: null,
  sections: [],
};

const validation: MealBuilderValidation = {
  status: "ok",
  ready: true,
  errors: [],
  warnings: [],
  checks: [],
  summary: {},
};

function actionResponse(action = "updated"): MealBuilderCardActionResponse {
  return {
    status: true,
    data: {
      contractVersion: "dashboard_meal_builder_card_action.v1",
      action,
      sectionKey: action === "deleted" ? null : "chef_choices",
      previousSectionKey: null,
      productId: null,
      section: null,
      draft,
      validation,
      summary: {
        sectionCount: 0,
        selectedProductCount: 0,
        ready: true,
        errorCount: 0,
        warningCount: 0,
      },
    },
  };
}

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.patch.mockReset();
  apiMock.delete.mockReset();
});

describe("Meal Builder card lifecycle API", () => {
  it("uses new-card picker defaults and /pickers/products", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: { status: true, data: { candidates: [], meta: { total: 0 } } },
    });

    await getNewDirectCardProductPicker({ q: "chicken" });

    assert.equal(apiMock.get.mock.calls[0][0], "/api/dashboard/meal-builder/pickers/products");
    assert.deepEqual(apiMock.get.mock.calls[0][1].params, {
      q: "chicken",
      search: undefined,
      targetSectionKey: undefined,
      diagnostics: undefined,
      include: undefined,
      unassignedOnly: true,
      includeUnavailable: false,
      includeNotLinked: undefined,
      page: undefined,
      limit: 1000,
    });
  });

  it("uses existing-card picker with targetSectionKey", async () => {
    apiMock.get.mockResolvedValueOnce({
      data: { status: true, data: { candidates: [], meta: { total: 0 } } },
    });

    await getExistingDirectCardProductPicker("secondary_card");

    assert.equal(apiMock.get.mock.calls[0][0], "/api/dashboard/meal-builder/pickers/secondary_card");
    assert.equal(apiMock.get.mock.calls[0][1].params.targetSectionKey, "secondary_card");
  });

  it("sends root create and patch payloads", async () => {
    apiMock.post.mockResolvedValueOnce({ data: actionResponse("created") });
    apiMock.patch.mockResolvedValueOnce({ data: actionResponse("updated") });

    await createMealBuilderProductSection({
      key: "chef_choices",
      titleOverride: { ar: "اختيارات الشيف", en: "Chef Choices" },
      selectedProductIds: ["product-1"],
      sortOrder: 20,
      visible: true,
    });
    await updateMealBuilderProductSection({
      sectionKey: "chef_choices",
      patch: { titleOverride: { ar: "الشيف", en: "Chef" } },
    });

    assert.equal(apiMock.post.mock.calls[0][0], "/api/dashboard/meal-builder/sections");
    assert.equal(apiMock.post.mock.calls[0][1].key, "chef_choices");
    assert.equal(apiMock.post.mock.calls[0][1].section, undefined);
    assert.equal(apiMock.patch.mock.calls[0][0], "/api/dashboard/meal-builder/sections/chef_choices");
    assert.deepEqual(apiMock.patch.mock.calls[0][1], {
      titleOverride: { ar: "الشيف", en: "Chef" },
    });
  });

  it("uses productIds array for add and no body for delete operations", async () => {
    apiMock.post.mockResolvedValueOnce({ data: actionResponse("products_added") });
    apiMock.delete
      .mockResolvedValueOnce({ data: actionResponse("product_removed") })
      .mockResolvedValueOnce({ data: actionResponse("deleted") });

    await addMealBuilderProducts({
      sectionKey: "chef_choices",
      productIds: ["product-1", "product-2"],
    });
    await removeMealBuilderProduct({
      sectionKey: "chef_choices",
      productId: "product-1",
    });
    await deleteMealBuilderProductSection("chef_choices");

    assert.equal(apiMock.post.mock.calls[0][0], "/api/dashboard/meal-builder/sections/chef_choices/products");
    assert.deepEqual(apiMock.post.mock.calls[0][1], {
      productIds: ["product-1", "product-2"],
    });
    assert.equal(
      apiMock.delete.mock.calls[0][0],
      "/api/dashboard/meal-builder/sections/chef_choices/products/product-1"
    );
    assert.equal(apiMock.delete.mock.calls[0][1], undefined);
    assert.equal(apiMock.delete.mock.calls[1][0], "/api/dashboard/meal-builder/sections/chef_choices");
    assert.equal(apiMock.delete.mock.calls[1][1], undefined);
  });

  it("defensively rejects card-action contract mismatches", () => {
    assert.throws(
      () => assertMealBuilderCardActionResponse({ status: true, data: { draft } }),
      /contract mismatch/
    );
  });
});
