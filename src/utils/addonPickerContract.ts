export const ADDON_QUERY_KEYS = {
  root: ["addons"],
  productPicker: ["addons", "product-picker"],
  categoryPicker: ["addons", "category-picker"],
} satisfies Record<string, string[]>;

export const ADDON_PICKER_PARAMS = {
  view: "picker",
  context: "addon_plan",
  linkableFor: "addon_plan",
  isVisible: "true",
  isAvailable: "true",
} as const;

export const addonPickerQueryKey = {
  productPicker: () => [...ADDON_QUERY_KEYS.productPicker],
  categoryPicker: () => [...ADDON_QUERY_KEYS.categoryPicker],
};

export const addonPickerSearchParams = (limit?: number) => {
  const params = new URLSearchParams(ADDON_PICKER_PARAMS);
  if (limit !== undefined) params.set("limit", String(limit));
  return params;
};

export const addonProductPickerUrl = (limit?: number) =>
  `/api/dashboard/menu/products?${addonPickerSearchParams(limit).toString()}`;

export const addonCategoryPickerUrl = (limit?: number) =>
  `/api/dashboard/menu/categories?${addonPickerSearchParams(limit).toString()}`;
