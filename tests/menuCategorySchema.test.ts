import assert from "node:assert/strict";
import menuCategorySchema from "../src/lib/validations/menuCategorySchema";
import { getMenuCategoryCreateDefaults } from "../src/utils/menuFormValues";
import { test } from "vitest";

test("menuCategorySchema.test", () => {
  const missingNames = menuCategorySchema.safeParse({
    ...getMenuCategoryCreateDefaults(),
    name: { ar: "", en: "" },
  });

  assert.equal(missingNames.success, false);
  assert.deepEqual(
    missingNames.success ? [] : missingNames.error.flatten().fieldErrors.name,
    ["الاسم بالعربية مطلوب", "الاسم بالإنجليزية مطلوب"]
  );

  const whitespaceNames = menuCategorySchema.safeParse({
    ...getMenuCategoryCreateDefaults(),
    name: { ar: "   ", en: "   " },
  });

  assert.equal(whitespaceNames.success, false);
  assert.deepEqual(
    whitespaceNames.success ? [] : whitespaceNames.error.flatten().fieldErrors.name,
    ["الاسم بالعربية مطلوب", "الاسم بالإنجليزية مطلوب"]
  );
});
