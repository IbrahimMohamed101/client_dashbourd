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

      const nextOptionIds = new Set(group.optionIds);
      const existingByOptionId = new Map(
        existing.options.map((option) => [option.optionId, option])
      );
      const removedOptionIds = existing.options
        .map((option) => option.optionId)
        .filter((optionId) => !nextOptionIds.has(optionId));
      for (const optionId of removedOptionIds) {
        await api.delete(
          `/api/dashboard/menu/products/${productId}/option-groups/${group.groupId}/options/${optionId}`
        );
      }

      for (const optionId of group.optionIds) {
        const current = existingByOptionId.get(optionId);
        if (current && isProductOptionAttached(current)) continue;
        const optionInput = group.options?.find((option) => option.optionId === optionId);
        await api.post(
          `/api/dashboard/menu/products/${productId}/option-groups/${group.groupId}/options`,
          {
            optionId,
            extraPriceHalala: optionInput?.extraPriceHalala,
            extraWeightUnitGrams: optionInput?.extraWeightUnitGrams,
            extraWeightPriceHalala: optionInput?.extraWeightPriceHalala,
            sortOrder: optionInput?.sortOrder,
            isActive: true,
            isVisible: true,
            isAvailable: true,
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

export function isProductOptionAttached(
  option: ProductCustomizationResponse["data"]["customization"]["groups"][number]["options"][number]
) {
  const relation = option.status?.product ?? option.status;
  return (
    relation?.isActive !== false &&
    relation?.isVisible !== false &&
    relation?.isAvailable !== false
  );
}
