/**
 * ── Menu API Response Normalizers ──
 *
 * The backend returns flat field names (nameAr, nameEn, active, order, etc.)
 * while the frontend expects nested/structured shapes (name: {ar, en}, isActive, sortOrder, etc.).
 *
 * Additionally, the backend returns `data: [...]` (a direct array) instead of
 * `data: { items: [...], pagination: {...} }`.
 *
 * These normalizers bridge that gap at the fetch boundary so the rest of the
 * app can work with the documented types.
 */

import type {
  MenuCategory,
  MenuMealCategory,
  MenuProtein,
  MenuPremiumProtein,
  MenuProduct,
  MenuOptionGroup,
  MenuOption,
  MenuCategoriesResponse,
  MenuMealCategoriesResponse,
  MenuProteinsResponse,
  MenuPremiumProteinsResponse,
  MenuProductsResponse,
  MenuOptionGroupsResponse,
  MenuOptionsResponse,
  MenuCategoryDetailResponse,
  MenuMealCategoryDetailResponse,
  MenuProteinDetailResponse,
  MenuPremiumProteinDetailResponse,
  MenuProductDetailResponse,
  MenuOptionGroupDetailResponse,
  MenuOptionDetailResponse,
  PaginationMeta,
} from "@/types/menuTypes";

import { normalizeAvailableForFromApi } from "@/constants/menuCatalog";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Safely extract an array from the backend response `data` field */
function extractItems(raw: any): any[] {
  if (!raw) return [];
  const data = raw.data ?? raw;

  // Shape A: { data: { items: [...] } }  (already normalized)
  if (data?.items && Array.isArray(data.items)) return data.items;

  // Shape B: { data: [...] }  (backend flat array)
  if (Array.isArray(data)) return data;

  // Shape C: single object (detail endpoint)
  return [];
}

/** Wrap an array into the paginated response shape the frontend expects */
function extractPagination(raw: any, itemCount: number): PaginationMeta {
  const data = raw?.data ?? raw;
  const pagination =
    data?.pagination ?? raw?.pagination ?? raw?.meta?.pagination ?? raw?.meta;

  if (pagination) {
    const limit = Number(pagination.limit ?? pagination.perPage ?? (itemCount || 25));
    const total = Number(pagination.total ?? pagination.totalItems ?? itemCount);
    const pages = Number(
      pagination.pages ?? pagination.totalPages ?? Math.max(1, Math.ceil(total / limit))
    );

    return {
      page: Number(pagination.page ?? pagination.currentPage ?? 1),
      limit,
      total,
      pages,
    };
  }

  return { page: 1, limit: itemCount || 25, total: itemCount, pages: 1 };
}

function toPaginatedResponse<T>(raw: any, items: T[]): {
  items: T[];
  pagination: PaginationMeta;
} {
  return {
    items,
    pagination: extractPagination(raw, items.length),
  };
}

function idFromRef(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const id = value.id ?? value._id;
  if (id) return String(id);
  if (typeof value.toHexString === "function") return value.toHexString();
  return "";
}

function nonEmptyString(value: any): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}

function firstNonEmptyString(...values: any[]): string {
  for (const value of values) {
    const normalized = nonEmptyString(value);
    if (normalized) return normalized;
  }
  return "";
}

function productPriceHalala(raw: any): number {
  const halala = raw.priceHalala ?? raw.price_halala;
  if (typeof halala === "number" && Number.isFinite(halala)) return halala;

  const sar = raw.price;
  if (typeof sar === "number" && Number.isFinite(sar)) return Math.round(sar * 100);

  return 0;
}

// ── Category Normalizer ──

function normalizeCategory(raw: any): MenuCategory {
  return {
    id: raw.id ?? raw._id ?? "",
    key: raw.key ?? "",
    name: {
      ar: raw.name?.ar ?? raw.nameAr ?? raw.name_ar ?? "",
      en: raw.name?.en ?? raw.nameEn ?? raw.name_en ?? "",
    },
    description: {
      ar: raw.description?.ar ?? raw.descriptionAr ?? raw.description_ar ?? "",
      en: raw.description?.en ?? raw.descriptionEn ?? raw.description_en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    isActive: raw.isActive ?? raw.active ?? raw.is_active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? raw.is_available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? raw.is_visible ?? true,
    availableFor: normalizeAvailableForFromApi(raw.availableFor ?? raw.available_for),
    availableForSubscription: raw.availableForSubscription ?? raw.available_for_subscription ?? true,
    ui: {
      cardVariant: raw.ui?.cardVariant ?? raw.ui?.card_variant ?? raw.cardVariant ?? raw.card_variant ?? "meal_builder",
    },
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeCategoriesResponse(raw: any): MenuCategoriesResponse {
  const items = extractItems(raw).map(normalizeCategory);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizeCategoryDetailResponse(raw: any): MenuCategoryDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeCategory(data),
  };
}

// â”€â”€ Meal Category Normalizer â”€â”€

function normalizeMealCategory(raw: any): MenuMealCategory {
  const normalized = normalizeCategory(raw);
  return {
    ...normalized,
    isAvailable: raw.isAvailable ?? raw.available ?? normalized.isAvailable ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? normalized.isVisible ?? true,
  };
}

export function normalizeMealCategoriesResponse(raw: any): MenuMealCategoriesResponse {
  const items = extractItems(raw).map(normalizeMealCategory);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizeMealCategoryDetailResponse(
  raw: any
): MenuMealCategoryDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeMealCategory(data),
  };
}

// â”€â”€ Protein Normalizer â”€â”€

function normalizeProtein(raw: any): MenuProtein {
  return {
    id: raw.id ?? raw._id ?? "",
    name: {
      ar: raw.name?.ar ?? raw.nameAr ?? raw.name_ar ?? "",
      en: raw.name?.en ?? raw.nameEn ?? raw.name_en ?? "",
    },
    description: {
      ar: raw.description?.ar ?? raw.descriptionAr ?? raw.description_ar ?? "",
      en: raw.description?.en ?? raw.descriptionEn ?? raw.description_en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    categoryId: raw.categoryId ?? raw.category_id ?? raw.category?._id ?? raw.category?.id ?? "",
    category: raw.category ? normalizeMealCategory(raw.category) : undefined,
    proteinGrams: raw.proteinGrams ?? raw.protein_grams ?? 0,
    carbGrams: raw.carbGrams ?? raw.carb_grams ?? 0,
    fatGrams: raw.fatGrams ?? raw.fat_grams ?? 0,
    isActive: raw.isActive ?? raw.active ?? raw.is_active ?? true,
    isAvailable: raw.isAvailable ?? raw.availableForOrder ?? raw.available ?? raw.is_available ?? raw.active ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? raw.is_visible ?? true,
    availableForOrder: raw.availableForOrder ?? raw.isAvailable ?? raw.available ?? raw.is_available ?? true,
    availableForSubscription: raw.availableForSubscription ?? raw.available_for_subscription ?? true,
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeProteinsResponse(raw: any): MenuProteinsResponse {
  const items = extractItems(raw).map(normalizeProtein);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizeProteinDetailResponse(raw: any): MenuProteinDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeProtein(data),
  };
}

// â”€â”€ Premium Protein Normalizer â”€â”€

function normalizePremiumProtein(raw: any): MenuPremiumProtein {
  const protein = normalizeProtein(raw);
  return {
    ...protein,
    extraFeeHalala: raw.extraFeeHalala ?? raw.extra_fee_halala ?? raw.extraFee ?? 0,
    currency: raw.currency ?? "SAR",
  };
}

export function normalizePremiumProteinsResponse(
  raw: any
): MenuPremiumProteinsResponse {
  const items = extractItems(raw).map(normalizePremiumProtein);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizePremiumProteinDetailResponse(
  raw: any
): MenuPremiumProteinDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizePremiumProtein(data),
  };
}

// ── Product Normalizer ──

function normalizeProduct(raw: any): MenuProduct {
  return {
    id: raw.id ?? raw._id ?? "",
    categoryId:
      idFromRef(raw.categoryId) ||
      idFromRef(raw.category_id) ||
      idFromRef(raw.category),
    key: raw.key ?? "",
    itemType: firstNonEmptyString(raw.itemType, raw.item_type, raw.type) || "product",
    name: {
      ar: raw.name?.ar ?? raw.nameAr ?? raw.name_ar ?? "",
      en: raw.name?.en ?? raw.nameEn ?? raw.name_en ?? "",
    },
    description: {
      ar: raw.description?.ar ?? raw.descriptionAr ?? raw.description_ar ?? "",
      en: raw.description?.en ?? raw.descriptionEn ?? raw.description_en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    pricingModel: raw.pricingModel ?? raw.pricing_model ?? raw.pricingType ?? "fixed",
    priceHalala: productPriceHalala(raw),
    baseUnitGrams: raw.baseUnitGrams ?? raw.base_unit_grams ?? undefined,
    defaultWeightGrams: raw.defaultWeightGrams ?? raw.default_weight_grams ?? undefined,
    minWeightGrams: raw.minWeightGrams ?? raw.min_weight_grams ?? undefined,
    maxWeightGrams: raw.maxWeightGrams ?? raw.max_weight_grams ?? undefined,
    weightStepGrams: raw.weightStepGrams ?? raw.weight_step_grams ?? undefined,
    isActive: raw.isActive ?? raw.active ?? raw.is_active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? raw.is_available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? raw.is_visible ?? true,
    availableFor: normalizeAvailableForFromApi(raw.availableFor ?? raw.available_for),
    availableForSubscription:
      raw.availableForSubscription ??
      raw.available_for_subscription ??
      normalizeAvailableForFromApi(raw.availableFor ?? raw.available_for).includes(
        "subscription"
      ),
    ui: {
      cardVariant: raw.ui?.cardVariant ?? raw.ui?.card_variant ?? raw.cardVariant ?? raw.card_variant ?? "standard",
      badge: raw.ui?.badge ?? raw.badge ?? "",
      ctaLabel: raw.ui?.ctaLabel ?? raw.ui?.cta_label ?? raw.ctaLabel ?? raw.cta_label ?? "",
      imageRatio: raw.ui?.imageRatio ?? raw.ui?.image_ratio ?? raw.imageRatio ?? raw.image_ratio ?? "square",
    },
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    groups: raw.groups,
    optionGroups: raw.optionGroups ?? raw.option_groups,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeProductsResponse(raw: any): MenuProductsResponse {
  const items = extractItems(raw).map(normalizeProduct);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizeProductDetailResponse(raw: any): MenuProductDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeProduct(data),
  };
}

// ── Option Group Normalizer ──

function normalizeOptionGroup(raw: any): MenuOptionGroup {
  return {
    id: raw.id ?? raw._id ?? "",
    key: raw.key ?? "",
    name: {
      ar: raw.name?.ar ?? raw.nameAr ?? raw.name_ar ?? "",
      en: raw.name?.en ?? raw.nameEn ?? raw.name_en ?? "",
    },
    description: {
      ar: raw.description?.ar ?? raw.descriptionAr ?? raw.description_ar ?? "",
      en: raw.description?.en ?? raw.descriptionEn ?? raw.description_en ?? "",
    },
    isActive: raw.isActive ?? raw.active ?? raw.is_active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? raw.is_available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? raw.is_visible ?? true,
    ui: {
      displayStyle: raw.ui?.displayStyle ?? raw.ui?.display_style ?? raw.displayStyle ?? raw.display_style ?? "chips",
    },
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeOptionGroupsResponse(raw: any): MenuOptionGroupsResponse {
  const items = extractItems(raw).map(normalizeOptionGroup);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizeOptionGroupDetailResponse(raw: any): MenuOptionGroupDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeOptionGroup(data),
  };
}

// ── Option Normalizer ──

function normalizeOption(raw: any): MenuOption {
  return {
    id: raw.id ?? raw._id ?? "",
    groupId: raw.groupId ?? raw.group_id ?? raw.group ?? "",
    key: raw.key ?? "",
    name: {
      ar: raw.name?.ar ?? raw.nameAr ?? raw.name_ar ?? "",
      en: raw.name?.en ?? raw.nameEn ?? raw.name_en ?? "",
    },
    description: {
      ar: raw.description?.ar ?? raw.descriptionAr ?? raw.description_ar ?? "",
      en: raw.description?.en ?? raw.descriptionEn ?? raw.description_en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    extraPriceHalala: raw.extraPriceHalala ?? raw.extra_price_halala ?? raw.extraPrice ?? 0,
    extraWeightUnitGrams: raw.extraWeightUnitGrams ?? raw.extra_weight_unit_grams ?? undefined,
    extraWeightPriceHalala: raw.extraWeightPriceHalala ?? raw.extra_weight_price_halala ?? undefined,
    isActive: raw.isActive ?? raw.active ?? raw.is_active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? raw.is_available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? raw.is_visible ?? true,
    displayCategoryKey: raw.displayCategoryKey ?? raw.display_category_key ?? raw.displayCategory ?? undefined,
    proteinFamilyKey: raw.proteinFamilyKey ?? raw.protein_family_key ?? raw.proteinFamily ?? undefined,
    premiumKey: raw.premiumKey ?? raw.premium_key ?? undefined,
    extraFeeHalala: raw.extraFeeHalala ?? raw.extra_fee_halala ?? raw.extraFee ?? undefined,
    ruleTags: raw.ruleTags ?? raw.rule_tags ?? undefined,
    selectionType: raw.selectionType ?? raw.selection_type ?? undefined,
    availableFor: normalizeAvailableForFromApi(raw.availableFor ?? raw.available_for),
    availableForSubscription: raw.availableForSubscription ?? raw.available_for_subscription ?? true,
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeOptionsResponse(raw: any): MenuOptionsResponse {
  const items = extractItems(raw).map(normalizeOption);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(raw, items),
  };
}

export function normalizeOptionDetailResponse(raw: any): MenuOptionDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeOption(data),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
