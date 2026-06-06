import api from "@/lib/apis";
import type {
  MenuProductsResponse,
  MenuProductDetailResponse,
  MenuProductComposerResponse,
  BulkUpdateProductsResponse,
  CreateMenuProductPayload,
  UpdateMenuProductPayload,
  BulkUpdateProductsPayload,
  ReorderItem,
  MenuProductListParams,
} from "@/types/menuTypes";
import {
  normalizeProductsResponse,
  normalizeProductDetailResponse,
  normalizeProductComposerResponse,
  normalizeBulkUpdateProductsResponse,
} from "@/utils/menuResponseNormalizers";
import { buildListQuery } from "@/utils/buildListQuery";
import { menuProductComposerUrl } from "@/utils/menuApiContract";

// ── List Products ──
// GET /api/dashboard/menu/products

export const fetchMenuProducts = async (
  params: MenuProductListParams = {}
): Promise<MenuProductsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/products${buildListQuery(params)}`
  );
  return normalizeProductsResponse(response.data);
};

// ── Get Product by ID ──

export const fetchMenuProductById = async (
  id: string
): Promise<MenuProductDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/products/${id}`);
  return normalizeProductDetailResponse(response.data);
};

export const fetchMenuProductComposer = async (
  id: string
): Promise<MenuProductComposerResponse> => {
  const response = await api.get(menuProductComposerUrl(id));
  return normalizeProductComposerResponse(response.data);
};

// ── Create Product ──
// POST /api/dashboard/menu/products

export const fetchCreateMenuProduct = async (
  data: CreateMenuProductPayload
): Promise<void> => {
  await api.post("/api/dashboard/menu/products", data);
};

// ── Update Product ──
// PATCH /api/dashboard/menu/products/:id

export const fetchUpdateMenuProduct = async (
  id: string,
  data: UpdateMenuProductPayload
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/products/${id}`, data);
};

export const fetchBulkUpdateMenuProducts = async (
  data: BulkUpdateProductsPayload
): Promise<BulkUpdateProductsResponse> => {
  const response = await api.patch("/api/dashboard/menu/products/bulk", data);
  return normalizeBulkUpdateProductsResponse(response.data);
};

// ── Update Product Availability ──
// PATCH /api/dashboard/menu/products/:id/availability

export const fetchUpdateMenuProductAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/products/${id}/availability`, {
    isAvailable,
  });
};

// ── Duplicate Product ──
// POST /api/dashboard/menu/products/:id/duplicate

export const fetchDuplicateMenuProduct = async (
  id: string
): Promise<MenuProductDetailResponse> => {
  const response = await api.post(`/api/dashboard/menu/products/${id}/duplicate`);
  return normalizeProductDetailResponse(response.data);
};

// ── Soft Delete Product ──
// DELETE /api/dashboard/menu/products/:id

export const fetchDeleteMenuProduct = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/menu/products/${id}`);
};

// ── Reorder Products ──
// PATCH /api/dashboard/menu/products/reorder

export const fetchReorderMenuProducts = async (
  items: ReorderItem[]
): Promise<void> => {
  await api.patch("/api/dashboard/menu/products/reorder", { items });
};
