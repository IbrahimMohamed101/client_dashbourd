import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ADDON_PICKER_PARAMS,
  ADDON_QUERY_KEYS,
  addonCategoryPickerUrl,
  addonPickerSearchParams,
  addonProductPickerUrl,
} from "../src/utils/addonPickerContract.ts";
import {
  ADDON_PICKER_INVALIDATION_KEYS,
  MENU_CATEGORY_AND_PRODUCT_INVALIDATION_KEYS,
  MENU_CATEGORY_INVALIDATION_KEYS,
  MENU_PRODUCT_AND_CATEGORY_INVALIDATION_KEYS,
  MENU_PRODUCT_INVALIDATION_KEYS,
} from "../src/hooks/menu/menuProductInvalidation.ts";

const productUrl = addonProductPickerUrl();
const productParams = new URLSearchParams(productUrl.split("?")[1]);

assert.equal(productUrl.startsWith("/api/dashboard/menu/products?"), true);
assert.equal(productParams.get("view"), "picker");
assert.equal(productParams.get("context"), "addon_plan");
assert.equal(productParams.get("linkableFor"), "addon_plan");
assert.equal(productParams.get("isVisible"), "true");
assert.equal(productParams.get("isAvailable"), "true");
assert.equal(productParams.has("availableFor"), false);

const categoryUrl = addonCategoryPickerUrl();
const categoryParams = new URLSearchParams(categoryUrl.split("?")[1]);

assert.equal(categoryUrl.startsWith("/api/dashboard/menu/categories?"), true);
for (const [key, value] of Object.entries(ADDON_PICKER_PARAMS)) {
  assert.equal(categoryParams.get(key), value);
  assert.equal(productParams.get(key), value);
}
assert.equal(categoryParams.has("availableFor"), false);

assert.equal(addonPickerSearchParams(100).get("limit"), "100");
assert.deepEqual(ADDON_QUERY_KEYS.root, ["addons"]);
assert.deepEqual(ADDON_QUERY_KEYS.productPicker, ["addons", "product-picker"]);
assert.deepEqual(ADDON_QUERY_KEYS.categoryPicker, [
  "addons",
  "category-picker",
]);
assert.deepEqual(ADDON_PICKER_INVALIDATION_KEYS, [
  ["addons", "product-picker"],
  ["addons", "category-picker"],
]);

const assertIncludesAddonPickerKeys = (keys: string[][]) => {
  assert.equal(
    keys.some((key) => key.join("\0") === "addons\0product-picker"),
    true
  );
  assert.equal(
    keys.some((key) => key.join("\0") === "addons\0category-picker"),
    true
  );
};

const assertNoRootAddonInvalidation = (keys: string[][]) => {
  assert.equal(
    keys.some((key) => key.length === 1 && key[0] === "addons"),
    false
  );
};

for (const keys of [
  MENU_PRODUCT_INVALIDATION_KEYS,
  MENU_PRODUCT_AND_CATEGORY_INVALIDATION_KEYS,
  MENU_CATEGORY_INVALIDATION_KEYS,
  MENU_CATEGORY_AND_PRODUCT_INVALIDATION_KEYS,
]) {
  assertIncludesAddonPickerKeys(keys);
  assertNoRootAddonInvalidation(keys);
}

assert.equal(
  MENU_PRODUCT_INVALIDATION_KEYS.some(
    (key) => key.length === 1 && key[0] === "menu.products"
  ),
  true
);
assert.equal(
  MENU_PRODUCT_AND_CATEGORY_INVALIDATION_KEYS.some(
    (key) => key.length === 1 && key[0] === "menu.categories"
  ),
  true
);
assert.equal(
  MENU_CATEGORY_INVALIDATION_KEYS.some(
    (key) => key.length === 1 && key[0] === "menu.categories"
  ),
  true
);
assert.equal(
  MENU_CATEGORY_AND_PRODUCT_INVALIDATION_KEYS.some(
    (key) => key.length === 1 && key[0] === "menu.products"
  ),
  true
);

const productHookSource = readFileSync(
  new URL("../src/hooks/menu/useMenuProducts.ts", import.meta.url),
  "utf8"
);
const productOnlyInvalidations = productHookSource.match(
  /invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS/g
);
assert.equal(productOnlyInvalidations?.length, 6);
assert.match(
  productHookSource,
  /invalidateKeys: MENU_PRODUCT_AND_CATEGORY_INVALIDATION_KEYS/
);

const categoryHookSource = readFileSync(
  new URL("../src/hooks/menu/useMenuCategories.ts", import.meta.url),
  "utf8"
);
const categoryOnlyInvalidations = categoryHookSource.match(
  /invalidateKeys: MENU_CATEGORY_INVALIDATION_KEYS/g
);
assert.equal(categoryOnlyInvalidations?.length, 4);
assert.match(
  categoryHookSource,
  /invalidateKeys: MENU_CATEGORY_AND_PRODUCT_INVALIDATION_KEYS/
);
