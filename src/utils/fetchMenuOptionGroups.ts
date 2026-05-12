import api from "@/lib/apis";
import type {
  MenuOptionGroupsResponse,
  MenuOptionGroupDetailResponse,
  CreateMenuOptionGroupPayload,
  UpdateMenuOptionGroupPayload,
  MenuListParams,
} from "@/types/menuTypes";

// ── List Option Groups ──
// GET /api/dashboard/menu/option-groups

export const fetchMenuOptionGroups = async (
  params: MenuListParams = {}
): Promise<MenuOptionGroupsResponse> => {
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
    `/api/dashboard/menu/option-groups${query ? `?${query}` : ""}`
  );
  return response.data;
};

// ── Get Option Group by ID ──
// GET /api/dashboard/menu/option-groups/:id

export const fetchMenuOptionGroupById = async (
  id: string
): Promise<MenuOptionGroupDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/option-groups/${id}`);
  return response.data;
};

// ── Create Option Group ──
// POST /api/dashboard/menu/option-groups

export const fetchCreateMenuOptionGroup = async (
  data: CreateMenuOptionGroupPayload
): Promise<void> => {
  await api.post("/api/dashboard/menu/option-groups", data);
};

// ── Update Option Group ──
// PATCH /api/dashboard/menu/option-groups/:id

export const fetchUpdateMenuOptionGroup = async (
  id: string,
  data: UpdateMenuOptionGroupPayload
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/option-groups/${id}`, data);
};

// ── Soft Delete Option Group ──
// DELETE /api/dashboard/menu/option-groups/:id

export const fetchDeleteMenuOptionGroup = async (
  id: string
): Promise<void> => {
  await api.delete(`/api/dashboard/menu/option-groups/${id}`);
};
