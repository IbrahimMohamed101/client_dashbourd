import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("add-on picker requests the complete admin catalog", () => {
  const source = read("src/utils/addonPickerContract.ts");
  assert.match(source, /view:\s*"addon_plan_picker"/);
  assert.match(source, /includeInactive:\s*"true"/);
  assert.doesNotMatch(source, /isVisible:\s*"true"/);
  assert.doesNotMatch(source, /isAvailable:\s*"true"/);
});

test("premium source form loads all catalog rows and blocks only unready rows", () => {
  const dialog = read("src/components/pages/premium-meals/CandidateLinkDialog.tsx");
  const picker = read("src/components/pages/premium-meals/MenuSourcePicker.tsx");
  assert.match(dialog, /status:\s*"all"/);
  assert.match(dialog, /selectedSource\.selectable === false/);
  assert.match(picker, /source\.selectable !== false/);
  assert.match(picker, /يحتاج تجهيز/);
});

test("meal builder visual cards are derived from authored sections", () => {
  const source = read("src/components/pages/menu/meal-builder/mealBuilderVisualModel.ts");
  assert.match(source, /sections\.forEach\(\(section, index\)/);
  assert.match(source, /uniqueSectionKey\(section, index, usedKeys\)/);
  assert.doesNotMatch(source, /CHICKEN_KEYS/);
  assert.doesNotMatch(source, /BEEF_MATCHERS/);
  assert.doesNotMatch(source, /REQUIRED_SECTION_ORDER\.map/);
});
