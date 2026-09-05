import { describe, expect, it } from "vitest";

import type { MenuOption, MenuOptionGroup } from "../src/types/menuTypes";
import type {
  MealPlannerBuilderGroup,
  MealPlannerCatalogCandidate,
} from "../src/types/mealPlannerDashboardTypes";
import {
  matchingEligibleBuilderGroups,
  mergeMenuOptionsWithPicker,
  optionRoleLabel,
} from "../src/components/pages/menu/meal-builder/mealPlannerOptionGroupFlow";
import {
  buildOptionFamilyPayload,
  candidateSelectable,
} from "../src/components/pages/menu/meal-builder/mealPlannerV2Utils";

const menuGroup: MenuOptionGroup = {
  id: "group-proteins",
  key: "proteins",
  name: { ar: "البروتين", en: "Proteins" },
  isActive: true,
  isAvailable: true,
  sortOrder: 1,
};

function builderGroup(
  overrides: Partial<MealPlannerBuilderGroup> = {}
): MealPlannerBuilderGroup {
  return {
    id: "builder-1",
    cardType: "option_family",
    selectionType: "standard_meal",
    productContextId: "product-1",
    sourceGroupId: menuGroup.id,
    optionRole: "protein",
    product: {
      id: "product-1",
      key: "basic-meal",
      name: { ar: "وجبة أساسية", en: "Basic Meal" },
      status: {},
    },
    group: {
      id: menuGroup.id,
      _id: menuGroup.id,
      key: menuGroup.key,
      name: menuGroup.name,
      status: {},
    },
    rules: { minSelections: 0, maxSelections: 1, isRequired: false },
    families: ["chicken", "fish"],
    options: [],
    optionCount: 2,
    assignableOptionCount: 2,
    compatible: true,
    eligible: true,
    reasonCodes: [],
    sortOrder: 1,
    ...overrides,
  };
}

const menuOptions: MenuOption[] = [
  {
    id: "option-chicken",
    groupId: menuGroup.id,
    key: "chicken",
    name: { ar: "دجاج", en: "Chicken" },
    extraPriceHalala: 0,
    isActive: true,
    isAvailable: true,
    sortOrder: 1,
    proteinFamilyKey: "chicken",
    availableFor: ["subscription"],
    availableForSubscription: true,
    selectionType: "standard_meal",
  },
  {
    id: "option-fish",
    groupId: menuGroup.id,
    key: "fish",
    name: { ar: "سمك", en: "Fish" },
    extraPriceHalala: 100,
    isActive: true,
    isAvailable: true,
    sortOrder: 2,
    proteinFamilyKey: "fish",
    availableFor: ["subscription"],
    availableForSubscription: true,
    selectionType: "standard_meal",
  },
  {
    id: "option-premium",
    groupId: menuGroup.id,
    key: "premium",
    name: { ar: "مميز", en: "Premium" },
    extraPriceHalala: 2000,
    isActive: true,
    isAvailable: true,
    sortOrder: 3,
    proteinFamilyKey: "chicken",
    premiumKey: "premium-test",
    availableFor: ["subscription"],
    availableForSubscription: true,
    selectionType: "premium_meal",
  },
];

describe("Meal Builder composed option-group flow", () => {
  it("matches save contexts by sourceGroupId only and rejects unsupported roles", () => {
    const groups = [
      builderGroup(),
      builderGroup({ id: "other", sourceGroupId: "group-carbs", optionRole: "carbs" }),
      builderGroup({ id: "unsupported", optionRole: null }),
      builderGroup({ id: "ineligible", eligible: false }),
    ];

    expect(matchingEligibleBuilderGroups(menuGroup.id, groups).map((group) => group.id)).toEqual([
      "builder-1",
    ]);
  });

  it("does not label a null or unsupported role as protein", () => {
    expect(optionRoleLabel(null)).toBe("دور غير مدعوم");
    expect(optionRoleLabel("vegetables")).toBe("دور غير مدعوم");
    expect(optionRoleLabel("protein")).toBe("بروتين");
    expect(optionRoleLabel("carbs")).toBe("كارب");
  });

  it("merges nested menu options with authoritative picker state by optionId", () => {
    const picker: MealPlannerCatalogCandidate[] = [
      {
        id: "picker-row-1",
        optionId: "option-chicken",
        assignable: true,
        eligible: true,
      },
      {
        id: "picker-row-2",
        optionId: "option-fish",
        assignable: false,
        assigned: true,
        assignedSectionKey: "other-card",
        reasonCodes: ["MEAL_BUILDER_OPTION_ALREADY_ASSIGNED"],
      },
    ];

    const rows = mergeMenuOptionsWithPicker(menuOptions, picker, ["option-chicken"]);
    expect(rows.map((row) => row.optionId)).toEqual([
      "option-chicken",
      "option-fish",
    ]);
    expect(rows[0]).toMatchObject({ selected: true, assignable: true });
    expect(rows[1]).toMatchObject({
      assignable: false,
      assigned: true,
      assignedSectionKey: "other-card",
    });
  });

  it("offers regular unlinked group options as explicit attach-on-save choices", () => {
    const rows = mergeMenuOptionsWithPicker(menuOptions, [], []);
    expect(rows.map((row) => row.optionId)).toEqual(["option-chicken", "option-fish"]);
    expect(rows.every((row) => candidateSelectable(row))).toBe(true);
    expect(rows.every((row) => row.linked === false)).toBe(true);
    expect(rows.every((row) => row.relationExists === false)).toBe(true);
    expect(rows.every((row) => row.attachable === true)).toBe(true);
    expect(rows.every((row) => row.state === "attachable_on_save")).toBe(true);
    expect(rows.some((row) => row.optionId === "option-premium")).toBe(false);
  });

  it("scopes attach-on-save protein options to the requested family", () => {
    const rows = mergeMenuOptionsWithPicker(menuOptions, [], [], "chicken");
    expect(rows.map((row) => row.optionId)).toEqual(["option-chicken"]);
    expect(rows[0]).toMatchObject({
      familyKey: "chicken",
      attachable: true,
      assignable: true,
    });
  });

  it("keeps a selected unlinked regular option selectable so save can attach it", () => {
    const rows = mergeMenuOptionsWithPicker(menuOptions, [], ["option-chicken"], "chicken");
    expect(rows[0]).toMatchObject({
      optionId: "option-chicken",
      selected: true,
      assignable: true,
      eligible: true,
      linked: false,
      relationExists: false,
      attachable: true,
      state: "attachable_on_save",
      reasonCodes: ["ATTACH_TO_PRODUCT_ON_SAVE"],
    });
    expect(candidateSelectable(rows[0])).toBe(true);
  });

  it("builds the canonical option-family create payload without product IDs as options", () => {
    const payload = buildOptionFamilyPayload({
      cardType: "option_family",
      key: "fish",
      titleAr: "سمك",
      titleEn: "Fish",
      visible: true,
      selectedIds: ["option-fish"],
      optionRole: "protein",
      familyKey: "fish",
      productContextId: "product-1",
      sourceGroupId: menuGroup.id,
      required: false,
      minSelections: 0,
      maxSelections: 1,
      multiSelect: false,
      sortOrder: 30,
    });

    expect(payload).toEqual({
      cardType: "option_family",
      key: "fish",
      titleOverride: { ar: "سمك", en: "Fish" },
      optionRole: "protein",
      familyKey: "fish",
      productContextId: "product-1",
      sourceGroupId: menuGroup.id,
      selectedOptionIds: ["option-fish"],
      selectionType: "standard_meal",
      sortOrder: 30,
      visible: true,
      required: false,
      minSelections: 0,
      maxSelections: 1,
      multiSelect: false,
    });
    expect(payload).not.toHaveProperty("selectedProductIds");
  });
});
