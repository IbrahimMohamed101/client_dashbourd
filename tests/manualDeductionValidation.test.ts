import { describe, expect, it } from "vitest";

import {
  getAddonAvailableUnits,
  validateManualDeductionSelection,
} from "../src/components/pages/manual-deduction/manualDeductionValidation";

const addon = {
  addonId: "addon-juice",
  name: "عصير",
  remainingQty: 7,
  totalQty: 7,
};

const availability = {
  regularMeals: 10,
  premiumMeals: 4,
  addons: [addon],
};

describe("manual deduction balance UX", () => {
  it("shows add-on units rather than the number of add-on types", () => {
    expect(getAddonAvailableUnits([addon])).toBe(7);
  });

  it("accepts the complete 10 regular + 4 premium + 7 add-on entitlement", () => {
    const result = validateManualDeductionSelection(
      {
        regularMeals: 10,
        premiumMeals: 4,
        addons: [{ addonId: addon.addonId, qty: 7 }],
      },
      availability
    );

    expect(result).toMatchObject({
      valid: true,
      empty: false,
      mealTotal: 14,
      addonTotal: 7,
    });
  });

  it("keeps add-ons independent from the meal total", () => {
    const result = validateManualDeductionSelection(
      {
        regularMeals: 0,
        premiumMeals: 0,
        addons: [{ addonId: addon.addonId, qty: 3 }],
      },
      availability
    );

    expect(result.valid).toBe(true);
    expect(result.mealTotal).toBe(0);
    expect(result.addonTotal).toBe(3);
  });

  it.each([
    [11, 0, 0, "regularMeals"],
    [0, 5, 0, "premiumMeals"],
    [0, 0, 8, "addons"],
  ])(
    "blocks overspending regular=%i premium=%i addon=%i",
    (regularMeals, premiumMeals, addonQty, field) => {
      const result = validateManualDeductionSelection(
        {
          regularMeals,
          premiumMeals,
          addons: [{ addonId: addon.addonId, qty: addonQty }],
        },
        availability
      );

      expect(result.valid).toBe(false);
      if (field === "addons") expect(result.errors.addons).toHaveLength(1);
      else expect(result.errors[field as "regularMeals" | "premiumMeals"]).toBeTruthy();
    }
  );

  it("requires at least one meal or add-on", () => {
    const result = validateManualDeductionSelection(
      {
        regularMeals: 0,
        premiumMeals: 0,
        addons: [{ addonId: addon.addonId, qty: 0 }],
      },
      availability
    );

    expect(result).toMatchObject({ valid: false, empty: true });
  });
});
