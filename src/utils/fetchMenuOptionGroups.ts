import api from "@/lib/apis";
import type {
  MenuOptionGroupsResponse,
  MenuOptionGroupDetailResponse,
  CreateMenuOptionGroupPayload,
  UpdateMenuOptionGroupPayload,
  ReorderItem,
  MenuListParams,
} from "@/types/menuTypes";
import {
  normalizeOptionGroupsResponse,
  normalizeOptionGroupDetailResponse,
} from "@/utils/menuResponseNormalizers";
import { buildListQuery } from "@/utils/buildListQuery";
import { menuOptionGroupVisibilityUrl } from "./menuApiContract";

// ── List Option Groups ──
// GET /api/dashboard/menu/option-groups

export const fetchMenuOptionGroups = async (
  params: MenuListParams = {}
): Promise<MenuOptionGroupsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/option-groups${buildListQuery(params)}`
  );
  return normalizeOptionGroupsResponse(response.data);
};

// ── Get Option Group by ID ──

export const fetchMenuOptionGroupById = async (
  id: string
): Promise<MenuOptionGroupDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu/option-groups/${id}`);
  return normalizeOptionGroupDetailResponse(response.data);
};

// ── Create Option Group ──
// POST /api/dashboard/menu/option-groups

export const fetchCreateMenuOptionGroup = async (
  data: CreateMenuOptionGroupPayload
): Promise<MenuOptionGroupDetailResponse> => {
  const response = await api.post("/api/dashboard/menu/option-groups", data);
  return normalizeOptionGroupDetailResponse(response.data);
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

export const fetchDeleteMenuOptionGroup = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/menu/option-groups/${id}`);
};

// ── Reorder Option Groups ──
// PATCH /api/dashboard/menu/option-groups/reorder

export const fetchReorderMenuOptionGroups = async (
  items: ReorderItem[]
): Promise<void> => {
  await api.patch("/api/dashboard/menu/option-groups/reorder", { items });
};

// ── Update Option Group Availability ──
// PATCH /api/dashboard/menu/option-groups/:id/availability

export const fetchUpdateMenuOptionGroupAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/option-groups/${id}/availability`, {
    isAvailable,
  });
};

// ── Toggle Option Group Active ──
// PATCH /api/dashboard/menu/option-groups/:id/visibility

export const fetchToggleMenuOptionGroupActive = async (
  id: string,
  isVisible: boolean
): Promise<void> => {
  await api.patch(menuOptionGroupVisibilityUrl(id), { isVisible });
};
