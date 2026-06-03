import api from "@/lib/apis";
import type {
  LinkGroupsPayload,
  UpdateSelectionRulesPayload,
  LinkOptionsPayload,
  UpdateOptionOverridePayload,
  MenuProductLinkedGroup,
  MenuProductLinkedOption,
} from "@/types/menuTypes";

export interface ProductGroupRelationsResponse {
  status: boolean;
  data:
    | MenuProductLinkedGroup[]
    | {
        items: MenuProductLinkedGroup[];
        pagination?: unknown;
      };
}

export interface ProductGroupOptionRelationsResponse {
  status: boolean;
  data:
    | MenuProductLinkedOption[]
    | {
        items: MenuProductLinkedOption[];
        pagination?: unknown;
      };
}

export const fetchProductGroupRelations = async (
  productId: string
): Promise<ProductGroupRelationsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/products/${productId}/option-groups?limit=100`
  );
  return response.data;
};

export const fetchProductGroupOptionRelations = async (
  productId: string,
  groupId: string
): Promise<ProductGroupOptionRelationsResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/products/${productId}/option-groups/${groupId}/options?limit=100`
  );
  return response.data;
};

// ── §10.1 Link Groups to Product ──
// PUT /api/dashboard/menu/products/:productId/groups
// WARNING: This replaces all groups. Send the full list.

export const fetchLinkGroupsToProduct = async (
  productId: string,
  data: LinkGroupsPayload
): Promise<void> => {
  await api.put(`/api/dashboard/menu/products/${productId}/groups`, data);
};

// ── §10.2 Update Selection Rules for a Group Inside a Product ──
// PATCH /api/dashboard/menu/products/:productId/option-groups/:groupId/selection-rules

export const fetchUpdateSelectionRules = async (
  productId: string,
  groupId: string,
  data: UpdateSelectionRulesPayload
): Promise<void> => {
  await api.patch(
    `/api/dashboard/menu/products/${productId}/option-groups/${groupId}/selection-rules`,
    data
  );
};

// ── §11.1 Link Options to a Group Inside a Product ──
// PUT /api/dashboard/menu/products/:productId/groups/:groupId/options
// WARNING: This replaces all options in this group for this product. Send the full list.

export const fetchLinkOptionsToGroup = async (
  productId: string,
  groupId: string,
  data: LinkOptionsPayload
): Promise<void> => {
  await api.put(
    `/api/dashboard/menu/products/${productId}/groups/${groupId}/options`,
    data
  );
};

// ── §11.2 Update Override for One Option ──
// PATCH /api/dashboard/menu/products/:productId/option-groups/:groupId/options/:optionId

export const fetchUpdateOptionOverride = async (
  productId: string,
  groupId: string,
  optionId: string,
  data: UpdateOptionOverridePayload
): Promise<void> => {
  await api.patch(
    `/api/dashboard/menu/products/${productId}/option-groups/${groupId}/options/${optionId}`,
    data
  );
};

// ── §11.3 Disable Option Inside Product ──
// PATCH /api/dashboard/menu/products/:productId/option-groups/:groupId/options/:optionId/availability

export const fetchUpdateOptionAvailabilityInProduct = async (
  productId: string,
  groupId: string,
  optionId: string,
  isAvailable: boolean
): Promise<void> => {
  await api.patch(
    `/api/dashboard/menu/products/${productId}/option-groups/${groupId}/options/${optionId}/availability`,
    { isAvailable }
  );
};
