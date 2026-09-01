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
  MenuOptionGroup,
} from "@/types/menuTypes";
import {
  normalizeOptionsResponse,
  normalizeOptionGroupsResponse,
  normalizeOptionGroupDetailResponse,
} from "@/utils/menuResponseNormalizers";
import { buildListQuery } from "@/utils/buildListQuery";
import { menuOptionGroupVisibilityUrl } from "./menuApiContract";

const QUARANTINED_OPTION_GROUPS = Object.freeze([
  {
    id: "6a6945c1080fae4ed07964e7",
    key: "pickup_slot_append_1785284024734_mixed_standard_protein_group",
  },
  {
    id: "6a6945c2080fae4ed0796504",
    key: "pickup_slot_append_1785284024734_mixed_premium_protein_group",
  },
  {
    id: "6a6945c3080fae4ed0796512",
    key: "pickup_slot_append_1785284024734_mixed_salad_protein_group",
  },
  {
    id: "6a6945c3080fae4ed079651b",
    key: "pickup_slot_append_1785284024734_mixed_sandwich_protein_group",
  },
]);

const PROTEIN_GROUP_PRESENTATION = Object.freeze([
  {
    id: "6a62197279ee075a57f70107",
    key: "proteins",
    name: { ar: "البروتين — الوجبات الأساسية", en: "Protein — Basic Meal" },
  },
  {
    id: "6a62250f79ee075a57f70223",
    key: "salad_proteins",
    name: { ar: "البروتين — السلطة الأساسية", en: "Protein — Basic Salad" },
  },
  {
    id: "6a62252179ee075a57f70263",
    key: "salad_extra_protein",
    name: { ar: "إضافات البروتين — 50g", en: "Protein Extras — 50g" },
  },
  {
    id: "6a6227ca79ee075a57f7029f",
    key: "protein",
    name: {
      ar: "البروتين — السلطة البريميوم",
      en: "Protein — Premium Large Salad",
    },
  },
]);

function isQuarantinedOptionGroup(group: MenuOptionGroup): boolean {
  return QUARANTINED_OPTION_GROUPS.some(
    (entry) => entry.id === group.id && entry.key === group.key
  );
}

function withDashboardOptionGroupPresentation(
  response: MenuOptionGroupsResponse
): MenuOptionGroupsResponse {
  const originalItems = response.data.items;
  const visibleItems = originalItems
    .filter((group) => !isQuarantinedOptionGroup(group))
    .map((group) => {
      const presentation = PROTEIN_GROUP_PRESENTATION.find(
        (entry) => entry.id === group.id && entry.key === group.key
      );

      return presentation ? { ...group, name: presentation.name } : group;
    });

  const hiddenCount = originalItems.length - visibleItems.length;
  if (hiddenCount === 0) {
    return {
      ...response,
      data: { ...response.data, items: visibleItems },
    };
  }

  const total = Math.max(0, response.data.pagination.total - hiddenCount);
  const limit = Math.max(1, response.data.pagination.limit || visibleItems.length || 1);

  return {
    ...response,
    data: {
      items: visibleItems,
      pagination: {
        ...response.data.pagination,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  };
}

export const fetchMenuOptionGroups = async (
  params: MenuListParams = {},
  signal?: AbortSignal
): Promise<MenuOptionGroupsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/option-groups${buildListQuery(params)}`,
    { signal }
  );
  return withDashboardOptionGroupPresentation(
    normalizeOptionGroupsResponse(response.data)
  );
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
