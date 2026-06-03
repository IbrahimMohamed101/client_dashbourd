/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEFAULT_MENU_AVAILABLE_FOR, normalizeAvailableForFromApi, normalizeMenuItemTypeFromApi } from "@/constants/menuCatalog";
import type { MenuCategory, MenuOption, MenuOptionGroup, MenuProduct } from "@/types/menuTypes";
import type { MenuCategorySchemaInput } from "@/lib/validations/menuCategorySchema";
import type { MenuOptionGroupSchemaInput } from "@/lib/validations/menuOptionGroupSchema";
import type { MenuOptionSchemaInput } from "@/lib/validations/menuOptionSchema";
import type { MenuProductSchemaInput } from "@/lib/validations/menuProductSchema";

const emptyLocalizedText = { ar: "", en: "" };

type IdRef =
  | string
  | { id?: string; _id?: string; toHexString?: () => string }
  | null
  | undefined;
type ProductLikeRef = MenuProduct & {
  category?: IdRef;
  category_id?: IdRef;
  item_type?: string | null;
  type?: string | null;
  price?: number | null;
  price_halala?: number | null;
};

const idFromRef = (value: IdRef) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const id = value.id ?? value._id;
  if (id) return String(id);
  if (typeof value.toHexString === "function") return value.toHexString();
  return "";
};

const firstIdFromRefs = (...values: IdRef[]) => {
  for (const value of values) {
    const id = idFromRef(value);
    if (id) return id;
  }
  return "";
};

const firstNonEmptyString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) return trimmed;
  }
  return "";
};

const getProductPriceSar = (product?: ProductLikeRef | null) => {
  if (!product) return 0;
  const halala = product.priceHalala ?? product.price_halala;
  if (typeof halala === "number" && Number.isFinite(halala)) return halala / 100;
  if (typeof product.price === "number" && Number.isFinite(product.price)) return product.price;
  return 0;
};

export const getMenuCategoryFormValues = (
  category?: MenuCategory | null
): MenuCategorySchemaInput => ({
  key: category?.key ?? "",
  name: category?.name ?? emptyLocalizedText,
  description: category?.description ?? emptyLocalizedText,
  imageUrl: category?.imageUrl ?? "",
  isActive: category?.isActive ?? true,
  isAvailable: category?.isAvailable ?? true,
  isVisible: category?.isVisible ?? true,
  ui: {
    cardVariant: category?.ui?.cardVariant ?? "meal_builder",
  },
  sortOrder: category?.sortOrder ?? 0,
});

export const getMenuOptionGroupFormValues = (
  group?: MenuOptionGroup | null
): MenuOptionGroupSchemaInput => ({
  key: group?.key ?? "",
  name: group?.name ?? emptyLocalizedText,
  description: group?.description ?? emptyLocalizedText,
  isActive: group?.isActive ?? true,
  isAvailable: group?.isAvailable ?? true,
  isVisible: group?.isVisible ?? true,
  ui: {
    displayStyle: group?.ui?.displayStyle ?? "chips",
  },
  sortOrder: group?.sortOrder ?? 0,
});

export const getMenuProductFormValues = (
  product?: ProductLikeRef | null
): MenuProductSchemaInput => ({
  categoryId: firstIdFromRefs(
    product?.categoryId,
    product?.category_id,
    product?.category
  ),
  key: product?.key ?? "",
  itemType: normalizeMenuItemTypeFromApi(
    firstNonEmptyString(product?.itemType, product?.item_type, product?.type)
  ),
  pricingModel: product?.pricingModel ?? "fixed",
  name: product?.name ?? emptyLocalizedText,
  description: product?.description ?? emptyLocalizedText,
  imageUrl: product?.imageUrl ?? "",
  priceSar: getProductPriceSar(product),
  baseUnitGrams: product?.baseUnitGrams != null ? product.baseUnitGrams : undefined,
  defaultWeightGrams: product?.defaultWeightGrams != null ? product.defaultWeightGrams : undefined,
  minWeightGrams: product?.minWeightGrams != null ? product.minWeightGrams : undefined,
  maxWeightGrams: product?.maxWeightGrams != null ? product.maxWeightGrams : undefined,
  weightStepGrams: product?.weightStepGrams != null ? product.weightStepGrams : undefined,
  isActive: product?.isActive ?? true,
  isAvailable: product?.isAvailable ?? true,
  isVisible: product?.isVisible ?? true,
  availableFor: normalizeAvailableForFromApi(product?.availableFor),
  availableForSubscription:
    product?.availableForSubscription ??
    normalizeAvailableForFromApi(product?.availableFor).includes("subscription"),
  ui: {
    cardVariant: product?.ui?.cardVariant ?? (product?.ui as any)?.card_variant ?? "standard",
    badge: product?.ui?.badge ?? (product as any)?.badge ?? "",
    ctaLabel: product?.ui?.ctaLabel ?? (product?.ui as any)?.cta_label ?? (product as any)?.ctaLabel ?? (product as any)?.cta_label ?? "",
    imageRatio: product?.ui?.imageRatio ?? (product?.ui as any)?.image_ratio ?? (product as any)?.imageRatio ?? (product as any)?.image_ratio ?? "square",
  },
  sortOrder: product?.sortOrder ?? 0,
});

export const getMenuOptionFormValues = (
  option?: MenuOption | null
): MenuOptionSchemaInput => ({
  groupId: idFromRef(option?.groupId),
  key: option?.key ?? "",
  name: option?.name ?? emptyLocalizedText,
  description: option?.description ?? emptyLocalizedText,
  imageUrl: option?.imageUrl ?? "",
  extraPriceSar: option ? (option.extraPriceHalala ?? 0) / 100 : 0,
  extraWeightUnitGrams: option?.extraWeightUnitGrams ?? undefined,
  extraWeightPriceSar:
    option?.extraWeightPriceHalala !== undefined && option.extraWeightPriceHalala !== null
      ? option.extraWeightPriceHalala / 100
      : undefined,
  isActive: option?.isActive ?? true,
  isAvailable: option?.isAvailable ?? true,
  isVisible: option?.isVisible ?? true,
  displayCategoryKey: option?.displayCategoryKey ?? "",
  proteinFamilyKey: option?.proteinFamilyKey ?? "",
  premiumKey: option?.premiumKey ?? "",
  extraFeeSar: option?.extraFeeHalala !== undefined && option.extraFeeHalala !== null ? option.extraFeeHalala / 100 : 0,
  ruleTags: Array.isArray(option?.ruleTags) ? option.ruleTags.join(", ") : "",
  selectionType: option?.selectionType ?? "",
  availableFor: normalizeAvailableForFromApi(option?.availableFor),
  availableForSubscription:
    option?.availableForSubscription ?? option?.availableFor?.includes("subscription") ?? true,
  sortOrder: option?.sortOrder ?? 0,
});

export const getMenuProductCreateDefaults = (): MenuProductSchemaInput => ({
  categoryId: "",
  key: "",
  itemType: "product",
  pricingModel: "fixed",
  name: emptyLocalizedText,
  description: emptyLocalizedText,
  imageUrl: "",
  priceSar: 0,
  isActive: true,
  isAvailable: true,
  isVisible: true,
  availableFor: [...DEFAULT_MENU_AVAILABLE_FOR],
  availableForSubscription: true,
  ui: {
    cardVariant: "standard",
    badge: "",
    ctaLabel: "",
    imageRatio: "square",
  },
  sortOrder: 0,
});

export const getMenuCategoryCreateDefaults = (): MenuCategorySchemaInput => ({
  key: "",
  name: emptyLocalizedText,
  description: emptyLocalizedText,
  imageUrl: "",
  isActive: true,
  isAvailable: true,
  isVisible: true,
  ui: {
    cardVariant: "meal_builder",
  },
  sortOrder: 0,
});

export const getMenuOptionGroupCreateDefaults = (): MenuOptionGroupSchemaInput => ({
  key: "",
  name: emptyLocalizedText,
  description: emptyLocalizedText,
  isActive: true,
  isAvailable: true,
  isVisible: true,
  ui: {
    displayStyle: "chips",
  },
  sortOrder: 0,
});

export const getMenuOptionCreateDefaults = (): MenuOptionSchemaInput => ({
  groupId: "",
  key: "",
  name: emptyLocalizedText,
  description: emptyLocalizedText,
  imageUrl: "",
  extraPriceSar: 0,
  isActive: true,
  isAvailable: true,
  isVisible: true,
  displayCategoryKey: "",
  proteinFamilyKey: "",
  premiumKey: "",
  extraFeeSar: 0,
  ruleTags: "",
  selectionType: "",
  availableFor: [...DEFAULT_MENU_AVAILABLE_FOR],
  availableForSubscription: true,
  sortOrder: 0,
});
