import api from "@/lib/apis";
import type {
  MenuCategoriesResponse,
  MenuCategoryDetailResponse,
  CategoryProductAssignmentResponse,
  CreateMenuCategoryPayload,
  UpdateMenuCategoryPayload,
  BulkAssignProductsToCategoryPayload,
  ReorderItem,
  MenuListParams,
} from "@/types/menuTypes";
import {
  normalizeCategoriesResponse,
  normalizeCategoryDetailResponse,
  normalizeCategoryProductAssignmentResponse,
} from "@/utils/menuResponseNormalizers";
import { buildListQuery } from "@/utils/buildListQuery";
import {
  menuCategoryAvailabilityUrl,
  menuCategoryVisibilityUrl,
} from "@/utils/menuApiContract";

// ── List Categories ──
// GET /api/dashboard/menu/categories

export const fetchMenuCategories = async (
  params: MenuListParams = {}
): Promise<MenuCategoriesResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/categories${buildListQuery(params)}`
  );
  return normalizeCategoriesResponse(response.data);
};

// ── Get Category by ID ──

export const fetchMenuCategoryById = async (
  id: string
): Promise<MenuCategoryDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/categories/${id}`);
  return normalizeCategoryDetailResponse(response.data);
};

// ── Create Category ──
// POST /api/dashboard/menu/categories

export const fetchCreateMenuCategory = async (
  data: CreateMenuCategoryPayload
): Promise<void> => {
  await api.post("/api/dashboard/menu/categories", data);
};

// ── Update Category ──
// PATCH /api/dashboard/menu/categories/:id

export const fetchUpdateMenuCategory = async (
  id: string,
  data: UpdateMenuCategoryPayload
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/categories/${id}`, data);
};

export const fetchUpdateMenuCategoryAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  await api.patch(menuCategoryAvailabilityUrl(id), { isAvailable });
};

export const fetchToggleMenuCategoryVisibility = async (
  id: string,
  isVisible: boolean
): Promise<void> => {
  await api.patch(menuCategoryVisibilityUrl(id), { isVisible });
};

export const fetchBulkAssignProductsToCategory = async (
  categoryId: string,
  data: BulkAssignProductsToCategoryPayload
): Promise<CategoryProductAssignmentResponse> => {
  const response = await api.post(
    `/api/dashboard/menu/categories/${categoryId}/products`,
    data
  );
  return normalizeCategoryProductAssignmentResponse(response.data);
};

// ── Soft Delete Category ──
// DELETE /api/dashboard/menu/categories/:id

export const fetchDeleteMenuCategory = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/menu/categories/${id}`);
};

// ── Reorder Categories ──
// PATCH /api/dashboard/menu/categories/reorder

export const fetchReorderMenuCategories = async (
  items: ReorderItem[]
): Promise<void> => {
  await api.patch("/api/dashboard/menu/categories/reorder", { items });
};
