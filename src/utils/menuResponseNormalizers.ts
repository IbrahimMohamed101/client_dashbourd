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
  MenuProduct,
  MenuOptionGroup,
  MenuOption,
  MenuCategoriesResponse,
  MenuProductsResponse,
  MenuOptionGroupsResponse,
  MenuOptionsResponse,
  MenuCategoryDetailResponse,
  MenuProductDetailResponse,
  MenuOptionGroupDetailResponse,
  MenuOptionDetailResponse,
} from "@/types/menuTypes";

// ── Helpers ──

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
function toPaginatedResponse<T>(items: T[]): {
  items: T[];
  pagination: { page: 1; limit: number; total: number; pages: 1 };
} {
  return {
    items,
    pagination: { page: 1, limit: items.length || 25, total: items.length, pages: 1 },
  };
}

// ── Category Normalizer ──

function normalizeCategory(raw: any): MenuCategory {
  // If the backend already returns the expected nested shape, pass through
  if (raw.name && typeof raw.name === "object" && "ar" in raw.name) {
    return raw as MenuCategory;
  }

  return {
    id: raw.id ?? raw._id ?? "",
    key: raw.key ?? "",
    name: {
      ar: raw.nameAr ?? raw.name_ar ?? raw.name?.ar ?? "",
      en: raw.nameEn ?? raw.name_en ?? raw.name?.en ?? "",
    },
    description: {
      ar: raw.descriptionAr ?? raw.description_ar ?? raw.description?.ar ?? "",
      en: raw.descriptionEn ?? raw.description_en ?? raw.description?.en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    isActive: raw.isActive ?? raw.active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? true,
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeCategoriesResponse(raw: any): MenuCategoriesResponse {
  const items = extractItems(raw).map(normalizeCategory);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(items),
  };
}

export function normalizeCategoryDetailResponse(raw: any): MenuCategoryDetailResponse {
  const data = raw.data ?? raw;
  return {
    status: raw.status ?? true,
    data: normalizeCategory(data),
  };
}

// ── Product Normalizer ──

function normalizeProduct(raw: any): MenuProduct {
  if (raw.name && typeof raw.name === "object" && "ar" in raw.name) {
    return raw as MenuProduct;
  }

  return {
    id: raw.id ?? raw._id ?? "",
    categoryId: raw.categoryId ?? raw.category_id ?? raw.category ?? "",
    key: raw.key ?? "",
    itemType: raw.itemType ?? raw.item_type ?? raw.type ?? "",
    name: {
      ar: raw.nameAr ?? raw.name_ar ?? raw.name?.ar ?? "",
      en: raw.nameEn ?? raw.name_en ?? raw.name?.en ?? "",
    },
    description: {
      ar: raw.descriptionAr ?? raw.description_ar ?? raw.description?.ar ?? "",
      en: raw.descriptionEn ?? raw.description_en ?? raw.description?.en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    pricingModel: raw.pricingModel ?? raw.pricing_model ?? raw.pricingType ?? "fixed",
    priceHalala: raw.priceHalala ?? raw.price_halala ?? raw.price ?? 0,
    baseUnitGrams: raw.baseUnitGrams ?? raw.base_unit_grams ?? undefined,
    defaultWeightGrams: raw.defaultWeightGrams ?? raw.default_weight_grams ?? undefined,
    minWeightGrams: raw.minWeightGrams ?? raw.min_weight_grams ?? undefined,
    maxWeightGrams: raw.maxWeightGrams ?? raw.max_weight_grams ?? undefined,
    weightStepGrams: raw.weightStepGrams ?? raw.weight_step_grams ?? undefined,
    isActive: raw.isActive ?? raw.active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? true,
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
    data: toPaginatedResponse(items),
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
  if (raw.name && typeof raw.name === "object" && "ar" in raw.name) {
    return raw as MenuOptionGroup;
  }

  return {
    id: raw.id ?? raw._id ?? "",
    key: raw.key ?? "",
    name: {
      ar: raw.nameAr ?? raw.name_ar ?? raw.name?.ar ?? "",
      en: raw.nameEn ?? raw.name_en ?? raw.name?.en ?? "",
    },
    description: {
      ar: raw.descriptionAr ?? raw.description_ar ?? raw.description?.ar ?? "",
      en: raw.descriptionEn ?? raw.description_en ?? raw.description?.en ?? "",
    },
    isActive: raw.isActive ?? raw.active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? true,
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeOptionGroupsResponse(raw: any): MenuOptionGroupsResponse {
  const items = extractItems(raw).map(normalizeOptionGroup);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(items),
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
  if (raw.name && typeof raw.name === "object" && "ar" in raw.name) {
    return raw as MenuOption;
  }

  return {
    id: raw.id ?? raw._id ?? "",
    groupId: raw.groupId ?? raw.group_id ?? raw.group ?? "",
    key: raw.key ?? "",
    name: {
      ar: raw.nameAr ?? raw.name_ar ?? raw.name?.ar ?? "",
      en: raw.nameEn ?? raw.name_en ?? raw.name?.en ?? "",
    },
    description: {
      ar: raw.descriptionAr ?? raw.description_ar ?? raw.description?.ar ?? "",
      en: raw.descriptionEn ?? raw.description_en ?? raw.description?.en ?? "",
    },
    imageUrl: raw.imageUrl ?? raw.image ?? "",
    extraPriceHalala: raw.extraPriceHalala ?? raw.extra_price_halala ?? raw.extraPrice ?? 0,
    extraWeightUnitGrams: raw.extraWeightUnitGrams ?? raw.extra_weight_unit_grams ?? undefined,
    extraWeightPriceHalala: raw.extraWeightPriceHalala ?? raw.extra_weight_price_halala ?? undefined,
    isActive: raw.isActive ?? raw.active ?? true,
    isAvailable: raw.isAvailable ?? raw.available ?? true,
    isVisible: raw.isVisible ?? raw.visible ?? true,
    sortOrder: raw.sortOrder ?? raw.order ?? raw.sort_order ?? 0,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

export function normalizeOptionsResponse(raw: any): MenuOptionsResponse {
  const items = extractItems(raw).map(normalizeOption);
  return {
    status: raw.status ?? true,
    data: toPaginatedResponse(items),
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
