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

// ── List Categories ──
// GET /api/dashboard/menu/categories

export const fetchMenuCategories = async (
  params: MenuListParams = {}
): Promise<MenuCategoriesResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.q) searchParams.append("q", params.q);
  if (params.isActive !== undefined)
    searchParams.append("isActive", params.isActive.toString());
  if (params.isAvailable !== undefined)
    searchParams.append("isAvailable", params.isAvailable.toString());

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu/categories${query ? `?${query}` : ""}`
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
