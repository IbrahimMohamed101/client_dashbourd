import api from "@/lib/apis";
import type {
  MenuCategoriesResponse,
  MenuCategoryDetailResponse,
  CreateMenuCategoryPayload,
  UpdateMenuCategoryPayload,
  ReorderItem,
  MenuListParams,
} from "@/types/menuTypes";
import {
  normalizeCategoriesResponse,
  normalizeCategoryDetailResponse,
} from "@/utils/menuResponseNormalizers";
import { buildListQuery } from "@/utils/buildListQuery";

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
