import assert from "node:assert/strict";
import test from "node:test";

import { mergeMenuOptionsWithPicker } from "../src/components/pages/menu/meal-builder/mealPlannerOptionGroupFlow";

test("menu options remain selectable when the authoritative picker omits them", () => {
  const rows = mergeMenuOptionsWithPicker(
    [
      {
        id: "menu-option-1",
        key: "oats",
        name: { ar: "شوفان", en: "Oats" },
        groupId: "group-1",
        isActive: true,
        isAvailable: true,
        sortOrder: 1,
      },
    ],
    [],
    []
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].optionId, "menu-option-1");
  assert.equal(rows[0].assignable, true);
  assert.equal(rows[0].state, "menu_catalog_fallback");
});

test("menu options use a unique authoritative picker candidate matched by key", () => {
  const rows = mergeMenuOptionsWithPicker(
    [
      {
        id: "menu-option-1",
        key: "oats",
        name: { ar: "شوفان", en: "Oats" },
        groupId: "group-1",
        isActive: true,
        isAvailable: true,
        sortOrder: 1,
      },
    ],
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

  assert.equal(rows[0].optionId, "authoritative-option-1");
  assert.equal(rows[0].assignable, true);
});
