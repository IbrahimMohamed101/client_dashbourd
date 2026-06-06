import api from "@/lib/apis";
import type {
  CustomizationLibraryResponse,
  ProductCustomizationResponse,
  SaveProductCustomizationPayload,
} from "@/types/menuCustomizationTypes";

export const fetchCustomizationLibrary =
  async (): Promise<CustomizationLibraryResponse> => {
    const response = await api.get("/api/dashboard/menu/customization-library");
    return response.data;
  };

export const fetchProductCustomization = async (
  productId: string
): Promise<ProductCustomizationResponse> => {
  const response = await api.get(
    `/api/dashboard/menu/products/${productId}/composer?contractVersion=v4`
  );
  return response.data;
};

export const saveProductCustomization = async (
  productId: string,
  payload: SaveProductCustomizationPayload
): Promise<ProductCustomizationResponse> => {
  await api.patch(`/api/dashboard/menu/products/${productId}/customization`, {
    isCustomizable: payload.isCustomizable,
    clearRelations: payload.clearRelations,
  });

  if (!payload.isCustomizable) {
    return fetchProductCustomization(productId);
  }

  const currentGroups =
    payload.currentGroups ?? (await fetchProductCustomization(productId)).data.customization.groups;
  const allowedOptionIds = payload.allowedOptionIds
    ? new Set(payload.allowedOptionIds)
    : null;
  const nextGroups = payload.groups.map((group) => ({
    ...group,
    optionIds: allowedOptionIds
      ? group.optionIds.filter((optionId) => allowedOptionIds.has(optionId))
      : group.optionIds,
  }));
  const nextGroupIds = new Set(payload.groups.map((group) => group.groupId));

  await Promise.all(
    currentGroups
      .filter((group) => !nextGroupIds.has(group.groupId))
      .map((group) =>
        api.delete(
          `/api/dashboard/menu/products/${productId}/option-groups/${group.groupId}`
        )
      )
  );

  for (const group of nextGroups) {
    const existing = currentGroups.find((item) => item.groupId === group.groupId);
    if (existing) {
      if (hasGroupRuleChanges(existing, group)) {
        await api.patch(
          `/api/dashboard/menu/products/${productId}/option-groups/${group.groupId}`,
          {
            minSelections: group.rules.minSelections,
            maxSelections: group.rules.maxSelections,
            isRequired: group.rules.isRequired,
            isActive: group.enabled,
            isVisible: group.enabled,
            isAvailable: group.enabled,
            sortOrder: group.sortOrder,
          }
        );
      }

      if (!sameOptionIds(existing.options.map((option) => option.optionId), group.optionIds)) {
        await api.put(
          `/api/dashboard/menu/products/${productId}/option-groups/${group.groupId}/options`,
          {
            optionIds: group.optionIds,
            preserveOverrides: true,
          }
        );
      }
    } else {
      await api.post(`/api/dashboard/menu/products/${productId}/option-groups`, {
        groupId: group.groupId,
        minSelections: group.rules.minSelections,
        maxSelections: group.rules.maxSelections,
        isRequired: group.rules.isRequired,
        isActive: group.enabled,
        isVisible: group.enabled,
        isAvailable: group.enabled,
        sortOrder: group.sortOrder,
        initialOptionIds: group.optionIds,
      });
    }
  }

  return fetchProductCustomization(productId);
};

function hasGroupRuleChanges(
  current: ProductCustomizationResponse["data"]["customization"]["groups"][number],
  next: SaveProductCustomizationPayload["groups"][number]
) {
  const currentEnabled =
    current.status?.isActive !== false &&
    current.status?.isVisible !== false &&
    current.status?.isAvailable !== false;

  return (
    current.rules.minSelections !== next.rules.minSelections ||
    current.rules.maxSelections !== next.rules.maxSelections ||
    current.rules.isRequired !== next.rules.isRequired ||
    currentEnabled !== next.enabled ||
    (current.sortOrder ?? 0) !== next.sortOrder
  );
}

function sameOptionIds(current: string[], next: string[]) {
  if (current.length !== next.length) return false;
  return current.every((optionId, index) => optionId === next[index]);
}
