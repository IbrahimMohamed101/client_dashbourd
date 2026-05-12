import api from "@/lib/apis";
import type {
  MenuOptionsResponse,
  MenuOptionDetailResponse,
  CreateMenuOptionPayload,
  UpdateMenuOptionPayload,
  MenuOptionListParams,
} from "@/types/menuTypes";

// ── List Options ──
// GET /api/dashboard/menu/options

export const fetchMenuOptions = async (
  params: MenuOptionListParams = {}
): Promise<MenuOptionsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.q) searchParams.append("q", params.q);
  if (params.groupId) searchParams.append("groupId", params.groupId);
  if (params.isActive !== undefined)
    searchParams.append("isActive", params.isActive.toString());
  if (params.isAvailable !== undefined)
    searchParams.append("isAvailable", params.isAvailable.toString());

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu/options${query ? `?${query}` : ""}`
  );
  return response.data;
};

// ── Get Option by ID ──
// GET /api/dashboard/menu/options/:id

export const fetchMenuOptionById = async (
  id: string
): Promise<MenuOptionDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/options/${id}`);
  return response.data;
};

// ── Create Option ──
// POST /api/dashboard/menu/options

export const fetchCreateMenuOption = async (
  data: CreateMenuOptionPayload
): Promise<void> => {
  await api.post("/api/dashboard/menu/options", data);
};

// ── Update Option ──
// PATCH /api/dashboard/menu/options/:id

export const fetchUpdateMenuOption = async (
  id: string,
  data: UpdateMenuOptionPayload
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/options/${id}`, data);
};

// ── Soft Delete Option ──
// DELETE /api/dashboard/menu/options/:id

export const fetchDeleteMenuOption = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/menu/options/${id}`);
};
