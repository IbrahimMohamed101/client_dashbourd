import { describe, expect, it } from "vitest";

import { mergeMenuOptionsWithPicker } from "../src/components/pages/menu/meal-builder/mealPlannerOptionGroupFlow";
import { candidateSelectable } from "../src/components/pages/menu/meal-builder/mealPlannerV2Utils";

const menuOption = {
  id: "menu-option-1",
  key: "oats",
  name: { ar: "شوفان", en: "Oats" },
  groupId: "group-1",
  extraPriceHalala: 0,
  isActive: true,
  isAvailable: true,
  isVisible: true,
  availableFor: ["subscription"],
  availableForSubscription: true,
  selectionType: "standard_meal",
  sortOrder: 1,
};

describe("Meal Builder option picker attach-on-save fallback", () => {
  it("offers a globally valid unlinked option only as an explicit attach-on-save candidate", () => {
    const rows = mergeMenuOptionsWithPicker([menuOption], [], []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      optionId: "menu-option-1",
      linked: false,
      relationExists: false,
      attachable: true,
      assignable: true,
      eligible: true,
      state: "attachable_on_save",
      reasonCodes: ["ATTACH_TO_PRODUCT_ON_SAVE"],
    });
    expect(candidateSelectable(rows[0])).toBe(true);
  });

  it("offers an unclassified standard protein inside a specific family for safe backend classification on save", () => {
    const rows = mergeMenuOptionsWithPicker(
      [
        {
          ...menuOption,
          id: "minced-beef",
          key: "minced_beef",
          name: { ar: "لحمة مفرومة", en: "Minced Beef" },
        },
      ],
      [],
      [],
      "beef"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      optionId: "minced-beef",
      attachable: true,
      assignable: true,
      eligible: true,
      classificationPending: true,
      state: "attachable_on_save",
      relationExists: false,
      reasonCodes: ["ATTACH_TO_PRODUCT_ON_SAVE", "CLASSIFY_FAMILY_ON_SAVE"],
    });
    expect(candidateSelectable(rows[0])).toBe(true);
  });

  it("renders every regular option from the selected group while disabling an explicitly conflicting family", () => {
    const rows = mergeMenuOptionsWithPicker(
      [
        {
          ...menuOption,
          id: "beef-option",
          key: "kofta",
          proteinFamilyKey: "beef",
          displayCategoryKey: "beef",
          sortOrder: 1,
        },
        {
          ...menuOption,
          id: "chicken-option",
          key: "grilled_chicken",
          proteinFamilyKey: "chicken",
          displayCategoryKey: "chicken",
          sortOrder: 2,
        },
        {
          ...menuOption,
          id: "unclassified-option",
          key: "minced_beef_new",
          proteinFamilyKey: "",
          displayCategoryKey: "",
          sortOrder: 3,
        },
      ],
      [],
      [],
      "beef"
    );

    expect(rows.map((row) => row.optionId)).toEqual([
      "beef-option",
      "chicken-option",
      "unclassified-option",
    ]);
    expect(rows.find((row) => row.optionId === "beef-option")).toMatchObject({
      attachable: true,
      assignable: true,
    });
    expect(rows.find((row) => row.optionId === "unclassified-option")).toMatchObject({
      attachable: true,
      assignable: true,
      classificationPending: true,
    });
    expect(rows.find((row) => row.optionId === "chicken-option")).toMatchObject({
      attachable: false,
      assignable: false,
      eligible: false,
      state: "not_attachable_to_product",
      reasonCodes: ["OPTION_FAMILY_MISMATCH"],
    });
    expect(candidateSelectable(rows.find((row) => row.optionId === "chicken-option")!)).toBe(false);
  });

  it("uses authoritative picker candidates as the identity source once a relation exists", () => {
    const rows = mergeMenuOptionsWithPicker(
      [menuOption],
      [
        {
          id: "picker-relation-1",
          optionId: "authoritative-option-1",
          key: "oats",
          name: { ar: "شوفان", en: "Oats" },
          type: "option",
          assignable: true,
          eligible: true,
        },
      ],
      []
    );

    expect(rows.map((row) => row.optionId)).toEqual([
      "authoritative-option-1",
      "menu-option-1",
    ]);
    expect(rows[0].assignable).toBe(true);
    expect(rows[1]).toMatchObject({
      optionId: "menu-option-1",
      attachable: true,
      relationExists: false,
    });
  });

  it("never lets global key equality change authoritative picker identities", () => {
    const rows = mergeMenuOptionsWithPicker(
      [menuOption],
      [
        { id: "one", optionId: "one", key: "oats", type: "option", assignable: true },
        { id: "two", optionId: "two", key: "oats", type: "option", assignable: true },
      ],
      []
    );

    expect(rows.map((row) => row.optionId)).toEqual(["one", "two", "menu-option-1"]);
    expect(rows.slice(0, 2).every((row) => row.assignable === true)).toBe(true);
    expect(rows[2]).toMatchObject({
      optionId: "menu-option-1",
      attachable: true,
      relationExists: false,
    });
  });

  it("does not expose Premium global options as attach-on-save choices", () => {
    const rows = mergeMenuOptionsWithPicker(
      [
        {
          ...menuOption,
          id: "premium-option",
          premiumKey: "steak",
          selectionType: "premium_meal",
        },
      ],
      [],
      []
    );
    expect(rows).toEqual([]);
  });
});
