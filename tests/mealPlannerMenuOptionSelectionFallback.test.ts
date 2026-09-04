import { describe, expect, it } from "vitest";

import { mergeMenuOptionsWithPicker } from "../src/components/pages/menu/meal-builder/mealPlannerOptionGroupFlow";

const menuOption = {
  id: "menu-option-1",
  key: "oats",
  name: { ar: "شوفان", en: "Oats" },
  groupId: "group-1",
  extraPriceHalala: 0,
  isActive: true,
  isAvailable: true,
  sortOrder: 1,
};

describe("Meal Builder option picker fail-closed fallback", () => {
  it("hides unlinked menu options when the authoritative picker omits them", () => {
    const rows = mergeMenuOptionsWithPicker([menuOption], [], []);
    expect(rows).toEqual([]);
  });

  it("uses authoritative picker candidates as the only selectable source", () => {
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

    expect(rows[0].optionId).toBe("authoritative-option-1");
    expect(rows[0].assignable).toBe(true);
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

    expect(rows.map((row) => row.optionId)).toEqual(["one", "two"]);
    expect(rows.every((row) => row.assignable === true)).toBe(true);
  });
});
