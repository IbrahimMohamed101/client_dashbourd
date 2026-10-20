import { describe, expect, it } from "vitest";

import {
  PROTEIN_FAMILY_OPTIONS,
  isProteinOptionGroup,
} from "../src/components/pages/menu/options/MenuOptionFormFields";
import { proteinFamilyLabel } from "../src/components/pages/menu/products/ProductCustomizationPanel";
import { mergeMenuOptionsWithPicker } from "../src/components/pages/menu/meal-builder/mealPlannerOptionGroupFlow";

describe("protein-family dashboard authoring", () => {
  it("shows the explicit bilingual family choices only for the canonical proteins group", () => {
    expect(isProteinOptionGroup({ key: "proteins" } as never)).toBe(true);
    expect(isProteinOptionGroup({ key: "protein" } as never)).toBe(true);
    expect(isProteinOptionGroup({ key: "carbs" } as never)).toBe(false);
    expect(PROTEIN_FAMILY_OPTIONS.map(({ value }) => value)).toEqual([
      "chicken",
      "beef",
      "fish",
      "eggs",
      "other",
    ]);
  });

  it("renders the resolved family and a fail-closed missing-classification label", () => {
    expect(proteinFamilyLabel({ proteinFamilyKey: "chicken" })).toBe(
      "العائلة: دجاج / Chicken"
    );
    expect(proteinFamilyLabel({ resolvedFamilyKey: "beef" })).toBe(
      "العائلة: لحم / Beef"
    );
    expect(proteinFamilyLabel({})).toBe("التصنيف غير محدد");
  });

  it("keeps unmapped protein options out of family pickers instead of defaulting to Chicken", () => {
    const options = [
      {
        id: "new-unmapped-chicken",
        key: "future_recipe_without_metadata",
        name: { ar: "وصفة جديدة", en: "New recipe" },
        proteinFamilyKey: "",
        resolvedFamilyKey: "",
      },
      {
        id: "explicit-chicken",
        key: "future_explicit_chicken",
        name: { ar: "وصفة صريحة", en: "Explicit recipe" },
        proteinFamilyKey: "chicken",
        resolvedFamilyKey: "chicken",
      },
    ];

    expect(
      mergeMenuOptionsWithPicker(options as never, [], [], "chicken").map(
        (item) => item.id
      )
    ).toEqual(["explicit-chicken"]);
  });
});
