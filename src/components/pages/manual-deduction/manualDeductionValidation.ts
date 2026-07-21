import type { ManualDeductionAddonBalance } from "@/types/subscriptionTypes";

export interface ManualDeductionSelection {
  regularMeals: number;
  premiumMeals: number;
  addons: Array<{ addonId: string; qty: number }>;
}

export interface ManualDeductionAvailability {
  regularMeals: number;
  premiumMeals: number;
  addons: ManualDeductionAddonBalance[];
}

export function getAddonAvailableUnits(addons: ManualDeductionAddonBalance[] = []) {
  return addons.reduce(
    (sum, addon) => sum + Math.max(0, Number(addon.remainingQty) || 0),
    0
  );
}

export function validateManualDeductionSelection(
  selection: ManualDeductionSelection,
  availability: ManualDeductionAvailability
) {
  const errors: {
    regularMeals?: string;
    premiumMeals?: string;
    addons: Array<{ index: number; message: string }>;
  } = { addons: [] };

  if (selection.regularMeals > availability.regularMeals) {
    errors.regularMeals = `المتاح ${availability.regularMeals} وجبة عادية فقط`;
  }
  if (selection.premiumMeals > availability.premiumMeals) {
    errors.premiumMeals = `المتاح ${availability.premiumMeals} وجبة مميزة فقط`;
  }

  selection.addons.forEach((selected, index) => {
    const balance = availability.addons.find(
      (addon) => addon.addonId === selected.addonId
    );
    const remaining = Math.max(0, Number(balance?.remainingQty) || 0);
    if (selected.qty > remaining) {
      errors.addons.push({
        index,
        message: `المتاح ${remaining} فقط من هذه الإضافة`,
      });
    }
  });

  const mealTotal = selection.regularMeals + selection.premiumMeals;
  const addonTotal = selection.addons.reduce((sum, addon) => sum + addon.qty, 0);

  return {
    valid:
      mealTotal + addonTotal > 0 &&
      !errors.regularMeals &&
      !errors.premiumMeals &&
      errors.addons.length === 0,
    empty: mealTotal + addonTotal === 0,
    mealTotal,
    addonTotal,
    errors,
  };
}
