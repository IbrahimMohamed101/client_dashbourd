import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/apis", () => ({ default: apiMock }));

import {
  addOptionFamilyItems,
  createOptionFamilyCard,
  deleteOptionFamilyCard,
  removeOptionFamilyItem,
  replaceOptionFamilyItems,
  updateOptionFamilyCard,
} from "./mealPlannerOptionDraftActions";

function backendActionResponse(action = "updated") {
  return {
    data: {
      status: true,
      data: {
        contractVersion: "dashboard_meal_builder_card_action.v2",
        action,
        sectionKey: "chicken",
        section: null,
        draft: {
          id: "draft-1",
          status: "draft",
          sections: [],
        },
        validation: {
          status: "ok",
          ready: true,
          errors: [],
          warnings: [],
          checks: [],
          summary: { sections: 0, errors: 0, warnings: 0 },
        },
        summary: {
          sectionCount: 0,
          ready: true,
          errorCount: 0,
          warningCount: 0,
        },
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.post.mockResolvedValue(backendActionResponse());
  apiMock.put.mockResolvedValue(backendActionResponse());
  apiMock.patch.mockResolvedValue(backendActionResponse());
  apiMock.delete.mockResolvedValue(backendActionResponse());
});

describe("mealPlannerOptionDraftActions", () => {
  it("creates an option-family card through the backend section action", async () => {
    const payload = {
      cardType: "option_family",
      key: "chicken",
      titleOverride: { ar: "دجاج", en: "Chicken" },
      optionRole: "protein",
      familyKey: "chicken",
      productContextId: "6a62197079ee075a57f70106",
      sourceGroupId: "6a62197279ee075a57f70107",
      selectedOptionIds: ["6a62197b79ee075a57f70128"],
      selectionType: "standard_meal",
      sortOrder: 30,
      visible: true,
      required: false,
      minSelections: 0,
      maxSelections: 1,
      multiSelect: false,
    } as Parameters<typeof createOptionFamilyCard>[0];

    await createOptionFamilyCard(payload);

    expect(apiMock.post).toHaveBeenCalledOnce();
    expect(apiMock.post).toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/sections",
      payload
    );
    expect(apiMock.put).not.toHaveBeenCalled();
  });

  it("updates a card through the backend instead of PUTting the whole draft", async () => {
    const patch = {
      cardType: "option_family",
      visible: false,
    } as Parameters<typeof updateOptionFamilyCard>[1];

    await updateOptionFamilyCard("chicken family", patch);

    expect(apiMock.patch).toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/sections/chicken%20family",
      patch
    );
    expect(apiMock.put).not.toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/draft",
      expect.anything()
    );
  });

  it("replaces selected options through the item endpoint and de-duplicates ids", async () => {
    await replaceOptionFamilyItems("chicken", ["a", "a", "b"]);

    expect(apiMock.put).toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/sections/chicken/items",
      { optionIds: ["a", "b"] }
    );
  });

  it("adds options through the backend option endpoint and de-duplicates ids", async () => {
    await addOptionFamilyItems("chicken", ["a", "a", "b"]);

    expect(apiMock.post).toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/sections/chicken/options",
      { optionIds: ["a", "b"] }
    );
  });

  it("removes one option through the backend without deleting the menu item", async () => {
    await removeOptionFamilyItem("chicken", "option/id");

    expect(apiMock.delete).toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/sections/chicken/options/option%2Fid"
    );
  });

  it("deletes only the Meal Builder card through the section endpoint", async () => {
    await deleteOptionFamilyCard("custom/card");

    expect(apiMock.delete).toHaveBeenCalledWith(
      "/api/dashboard/meal-builder/sections/custom%2Fcard"
    );
  });

  it("accepts the backend v1 action contract for compatibility", async () => {
    const response = backendActionResponse();
    response.data.data.contractVersion = "dashboard_meal_builder_card_action.v1";
    apiMock.post.mockResolvedValueOnce(response);

    await expect(addOptionFamilyItems("chicken", ["a"])).resolves.toEqual(
      response.data
    );
  });

  it("fails closed when the backend action response is malformed", async () => {
    apiMock.put.mockResolvedValueOnce({
      data: {
        status: true,
        data: {
          contractVersion: "unexpected_contract",
          draft: { sections: [] },
          validation: {},
        },
      },
    });

    await expect(replaceOptionFamilyItems("chicken", ["a"])).rejects.toThrow(
      "عقد إجراءات منشئ الوجبات غير متوافق"
    );
  });
});
