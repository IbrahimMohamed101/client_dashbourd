import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/apis", () => ({ default: apiMock }));

import {
  isProductOptionAttached,
  saveProductCustomization,
} from "../src/utils/fetchMenuCustomization";
import type {
  ProductCustomizationGroup,
  ProductCustomizationResponse,
  SaveProductCustomizationPayload,
} from "../src/types/menuCustomizationTypes";

const productId = "product-basic-meal";
const groupId = "group-carbs";

function option(
  optionId: string,
  relationEnabled = true
): ProductCustomizationGroup["options"][number] {
  return {
    productOptionId: `relation-${optionId}`,
    optionId,
    key: optionId,
    name: { ar: optionId, en: optionId },
    status: {
      global: { isActive: true, isVisible: true, isAvailable: true },
      product: {
        isActive: relationEnabled,
        isVisible: relationEnabled,
        isAvailable: relationEnabled,
      },
      effective: {
        isActive: relationEnabled,
        isVisible: relationEnabled,
        isAvailable: relationEnabled,
      },
    },
    sortOrder: 10,
  };
}

function group(options: ProductCustomizationGroup["options"]): ProductCustomizationGroup {
  return {
    productGroupId: "product-group-carbs",
    groupId,
    key: "carbs",
    name: { ar: "النشويات", en: "Carbs" },
    rules: { minSelections: 1, maxSelections: 2, isRequired: true },
    status: { isActive: true, isVisible: true, isAvailable: true },
    sortOrder: 20,
    options,
  };
}

function response(currentGroups: ProductCustomizationGroup[]): ProductCustomizationResponse {
  return {
    status: true,
    data: {
      contractVersion: "dashboard_product_composer.v4",
      product: {
        id: productId,
        key: "basic_meal",
        name: { ar: "وجبة بيسك", en: "Basic Meal" },
        isCustomizable: true,
        isActive: true,
        isVisible: true,
        isAvailable: true,
      },
      category: null,
      customization: { enabled: true, groups: currentGroups },
    },
  };
}

beforeEach(() => {
  Object.values(apiMock).forEach((mock) => mock.mockReset());
  apiMock.patch.mockResolvedValue({ data: { status: true } });
  apiMock.post.mockResolvedValue({ data: { status: true } });
  apiMock.delete.mockResolvedValue({ data: { status: true } });
});

describe("product-scoped option authoring", () => {
  it("attaches new options and reactivates disabled relations through the authoritative POST endpoint", async () => {
    const current = group([option("active-option"), option("inactive-option", false)]);
    const payload: SaveProductCustomizationPayload = {
      isCustomizable: true,
      currentGroups: [current],
      groups: [
        {
          groupId,
          rules: current.rules,
          enabled: true,
          sortOrder: 20,
          optionIds: ["active-option", "inactive-option", "new-option"],
          options: [
            { optionId: "active-option", sortOrder: 10 },
            { optionId: "inactive-option", sortOrder: 20 },
            { optionId: "new-option", sortOrder: 30 },
          ],
        },
      ],
    };
    apiMock.get.mockResolvedValue({ data: response([current]) });

    await saveProductCustomization(productId, payload);

    const endpoint = `/api/dashboard/menu/products/${productId}/option-groups/${groupId}/options`;
    expect(apiMock.post).toHaveBeenCalledTimes(2);
    expect(apiMock.post).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        optionId: "inactive-option",
        isActive: true,
        isVisible: true,
        isAvailable: true,
      })
    );
    expect(apiMock.post).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({ optionId: "new-option" })
    );
    expect(
      apiMock.post.mock.calls.some(([, body]) => body.optionId === "active-option")
    ).toBe(false);
  });

  it("removes only the product relation and never deletes the global MenuOption", async () => {
    const current = group([option("keep-option"), option("remove-option")]);
    const payload: SaveProductCustomizationPayload = {
      isCustomizable: true,
      currentGroups: [current],
      groups: [
        {
          groupId,
          rules: current.rules,
          enabled: true,
          sortOrder: 20,
          optionIds: ["keep-option"],
          options: [{ optionId: "keep-option" }],
        },
      ],
    };
    apiMock.get.mockResolvedValue({ data: response([group([option("keep-option")])]) });

    await saveProductCustomization(productId, payload);

    expect(apiMock.delete).toHaveBeenCalledExactlyOnceWith(
      `/api/dashboard/menu/products/${productId}/option-groups/${groupId}/options/remove-option`
    );
    expect(
      apiMock.delete.mock.calls.some(([url]) => url === "/api/dashboard/menu/options/remove-option")
    ).toBe(false);
  });

  it("creates a new product group with only the explicitly selected initial options", async () => {
    const next = group([option("carb-one"), option("carb-two")]);
    const payload: SaveProductCustomizationPayload = {
      isCustomizable: true,
      currentGroups: [],
      groups: [
        {
          groupId,
          rules: next.rules,
          enabled: true,
          sortOrder: 20,
          optionIds: ["carb-one", "carb-two"],
        },
      ],
    };
    apiMock.get.mockResolvedValue({ data: response([next]) });

    await saveProductCustomization(productId, payload);

    expect(apiMock.post).toHaveBeenCalledExactlyOnceWith(
      `/api/dashboard/menu/products/${productId}/option-groups`,
      expect.objectContaining({
        groupId,
        initialOptionIds: ["carb-one", "carb-two"],
      })
    );
  });

  it("reads the product relation status instead of treating disabled nested status as active", () => {
    expect(isProductOptionAttached(option("active"))).toBe(true);
    expect(isProductOptionAttached(option("inactive", false))).toBe(false);
  });
});
