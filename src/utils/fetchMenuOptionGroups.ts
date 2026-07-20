import api from "@/lib/apis";
import type {
  MenuOptionGroupsResponse,
  MenuOptionGroupDetailResponse,
  MenuOptionsResponse,
  CreateMenuOptionPayload,
  CreateMenuOptionGroupPayload,
  UpdateMenuOptionGroupPayload,
  ReorderItem,
  MenuListParams,
} from "@/types/menuTypes";
import {
  normalizeOptionsResponse,
  normalizeOptionGroupsResponse,
  normalizeOptionGroupDetailResponse,
} from "@/utils/menuResponseNormalizers";
import { buildListQuery } from "@/utils/buildListQuery";
import { menuOptionGroupVisibilityUrl } from "./menuApiContract";

export const fetchMenuOptionGroups = async (
  params: MenuListParams = {},
  signal?: AbortSignal
): Promise<MenuOptionGroupsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/option-groups${buildListQuery(params)}`,
    { signal }
  );
  return normalizeOptionGroupsResponse(response.data);
};

export const fetchMenuOptionGroupById = async (
  id: string
): Promise<MenuOptionGroupDetailResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/option-groups/${id}?includeInactive=true`
  );
  return normalizeOptionGroupDetailResponse(response.data);
};

export const fetchMenuOptionGroupOptions = async (
  groupId: string,
  params: MenuListParams = { limit: 100 },
  signal?: AbortSignal
): Promise<MenuOptionsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/option-groups/${groupId}/options${buildListQuery(params)}`,
    { signal }
  );
  return normalizeOptionsResponse(response.data);
};

export const fetchCreateMenuOptionInGroup = async (
  groupId: string,
  data: CreateMenuOptionPayload
): Promise<void> => {
  await api.post(`/api/dashboard/menu/option-groups/${groupId}/options`, data);
};

export const fetchCreateMenuOptionGroup = async (
  data: CreateMenuOptionGroupPayload
): Promise<MenuOptionGroupDetailResponse> => {
  const response = await api.post("/api/dashboard/menu/option-groups", data);
  return normalizeOptionGroupDetailResponse(response.data);
};

export const fetchUpdateMenuOptionGroup = async (
  id: string,
  data: UpdateMenuOptionGroupPayload
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/option-groups/${id}`, data);
};

export const fetchDeleteMenuOptionGroup = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/menu/option-groups/${id}`);
};

export const fetchReorderMenuOptionGroups = async (
  items: ReorderItem[]
): Promise<void> => {
  await api.patch("/api/dashboard/menu/option-groups/reorder", { items });
};

export const fetchUpdateMenuOptionGroupAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  await api.patch(`/api/dashboard/menu/option-groups/${id}/availability`, {
    isAvailable,
  });
};

export const fetchToggleMenuOptionGroupActive = async (
  id: string,
  isVisible: boolean
): Promise<void> => {
  await api.patch(menuOptionGroupVisibilityUrl(id), { isVisible });
};
