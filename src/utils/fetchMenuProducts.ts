import api from "@/lib/apis";
import type {
  MenuProductsResponse,
  MenuProductDetailResponse,
  CreateMenuProductPayload,
  UpdateMenuProductPayload,
  ReorderItem,
  MenuProductListParams,
} from "@/types/menuTypes";

// ── List Products ──
// GET /api/dashboard/menu/products

export const fetchMenuProducts = async (
  params: MenuProductListParams = {}
): Promise<MenuProductsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.q) searchParams.append("q", params.q);
  if (params.categoryId) searchParams.append("categoryId", params.categoryId);
  if (params.pricingModel)
    searchParams.append("pricingModel", params.pricingModel);
  if (params.itemType) searchParams.append("itemType", params.itemType);
  if (params.isActive !== undefined)
    searchParams.append("isActive", params.isActive.toString());
  if (params.isAvailable !== undefined)
    searchParams.append("isAvailable", params.isAvailable.toString());

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu/products${query ? `?${query}` : ""}`
  );
  return response.data;
};

// ── Get Product by ID ──

export const fetchMenuProductById = async (
  id: string
): Promise<MenuProductDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/products/${id}`);
  return response.data;
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
