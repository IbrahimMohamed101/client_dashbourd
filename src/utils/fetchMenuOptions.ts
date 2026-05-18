import api from "@/lib/apis";
import type {
  MenuOptionsResponse,
  MenuOptionDetailResponse,
  CreateMenuOptionPayload,
  UpdateMenuOptionPayload,
  MenuOptionListParams,
  ReorderItem,
} from "@/types/menuTypes";
import {
  normalizeOptionsResponse,
  normalizeOptionDetailResponse,
} from "@/utils/menuResponseNormalizers";
import { menuOptionVisibilityUrl } from "./menuApiContract";

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
  return normalizeOptionsResponse(response.data);
};

// ── Get Option by ID ──
// GET /api/dashboard/menu/options/:id

export const fetchMenuOptionById = async (
  id: string
): Promise<MenuOptionDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/options/${id}`);
  return normalizeOptionDetailResponse(response.data);
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

// ── Reorder Options ──
// PATCH /api/dashboard/menu/options/reorder

export const fetchReorderMenuOptions = async (
  items: ReorderItem[]
): Promise<void> => {
  await api.patch("/api/dashboard/menu/options/reorder", { items });
};

// ── Update Option Availability ──
// PATCH /api/dashboard/menu/options/:id/availability

export const fetchUpdateMenuOptionAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/options/${id}/availability`, {
    isAvailable,
  });
};

// ── Toggle Option Active ──
// PATCH /api/dashboard/menu/options/:id/visibility

export const fetchToggleMenuOptionActive = async (
  id: string,
  isVisible: boolean
): Promise<void> => {
  await api.patch(menuOptionVisibilityUrl(id), { isVisible });
};
