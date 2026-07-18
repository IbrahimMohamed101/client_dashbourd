import api from "@/lib/apis";
import { fetchMealPlannerMenuPreview } from "@/utils/fetchMealPlannerMenu";
import type {
  MealBuilderAddProductsPayload,
  MealBuilderCardActionResponse,
  MealBuilderConfigResponse,
  MealBuilderDirectCardCreatePayload,
  MealBuilderDirectCardPatchPayload,
  MealBuilderDraftPayload,
  MealBuilderHydratedDraftResponse,
  MealBuilderLifecycleResponse,
  MealBuilderPickerParams,
  MealBuilderPickerResponse,
  MealBuilderPublishResponse,
  MealBuilderReadinessResponse,
  MealBuilderStateResponse,
  MealBuilderValidationResponse,
} from "@/types/mealBuilderTypes";

export const MEAL_BUILDER_BASE_ROUTE = "/api/dashboard/meal-builder";

export const getMealBuilder = async (): Promise<MealBuilderStateResponse> => {
  const response = await api.get(MEAL_BUILDER_BASE_ROUTE);
  return response.data;
};

export const getPublishedMealBuilder =
  async (): Promise<MealBuilderLifecycleResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/published`);
    return response.data;
  };

export const getMealBuilderDraft =
  async (): Promise<MealBuilderLifecycleResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/draft`);
    return response.data;
  };

export const resetMealBuilderDraft =
  async (): Promise<MealBuilderLifecycleResponse> => {
    const response = await api.post(`${MEAL_BUILDER_BASE_ROUTE}/draft/reset`);
  return response.data;
};

export const getMealBuilderHydratedDraft =
  async (): Promise<MealBuilderHydratedDraftResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/draft/hydrated`, {
      params: { lang: "ar" },
    });
    return response.data;
  };

export const getMealBuilderPicker = async (
  sectionKey: string,
  params: MealBuilderPickerParams = {}
): Promise<MealBuilderPickerResponse> => {
  const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/pickers/${sectionKey}`, {
    params: {
      q: params.q || undefined,
      search: params.search || undefined,
      targetSectionKey: params.targetSectionKey || undefined,
      diagnostics: params.diagnostics,
      include: params.include,
      unassignedOnly: params.unassignedOnly,
      includeUnavailable: params.includeUnavailable,
      includeNotLinked: params.includeNotLinked,
      page: params.page,
      limit: params.limit,
    },
  });
  return response.data;
};

export const getNewDirectCardProductPicker = async (
  params: MealBuilderPickerParams = {}
): Promise<MealBuilderPickerResponse> =>
  getMealBuilderPicker("products", {
    limit: 1000,
    unassignedOnly: true,
    includeUnavailable: false,
    ...params,
  });

export const getExistingDirectCardProductPicker = async (
  sectionKey: string,
  params: MealBuilderPickerParams = {}
): Promise<MealBuilderPickerResponse> =>
  getMealBuilderPicker(sectionKey, {
    limit: 1000,
    unassignedOnly: true,
    includeUnavailable: false,
    targetSectionKey: sectionKey,
    ...params,
  });

export const createMealBuilderDraft =
  async (): Promise<MealBuilderConfigResponse> => {
    const response = await api.post(`${MEAL_BUILDER_BASE_ROUTE}/draft`);
    return response.data;
  };

export const createMealBuilderProductSection = async (
  payload: MealBuilderDirectCardCreatePayload
): Promise<MealBuilderCardActionResponse> => {
  const response = await api.post(`${MEAL_BUILDER_BASE_ROUTE}/sections`, payload);
  return assertMealBuilderCardActionResponse(response.data);
};

export const updateMealBuilderProductSection = async ({
  sectionKey,
  patch,
}: {
  sectionKey: string;
  patch: MealBuilderDirectCardPatchPayload;
}): Promise<MealBuilderCardActionResponse> => {
  const response = await api.patch(
    `${MEAL_BUILDER_BASE_ROUTE}/sections/${encodeURIComponent(sectionKey)}`,
    patch
  );
  return assertMealBuilderCardActionResponse(response.data);
};

export const deleteMealBuilderProductSection = async (
  sectionKey: string
): Promise<MealBuilderCardActionResponse> => {
  const response = await api.delete(
    `${MEAL_BUILDER_BASE_ROUTE}/sections/${encodeURIComponent(sectionKey)}`
  );
  return assertMealBuilderCardActionResponse(response.data);
};

export const addMealBuilderProducts = async ({
  sectionKey,
  productIds,
}: MealBuilderAddProductsPayload & {
  sectionKey: string;
}): Promise<MealBuilderCardActionResponse> => {
  const response = await api.post(
    `${MEAL_BUILDER_BASE_ROUTE}/sections/${encodeURIComponent(sectionKey)}/products`,
    { productIds }
  );
  return assertMealBuilderCardActionResponse(response.data);
};

export const removeMealBuilderProduct = async ({
  sectionKey,
  productId,
}: {
  sectionKey: string;
  productId: string;
}): Promise<MealBuilderCardActionResponse> => {
  const response = await api.delete(
    `${MEAL_BUILDER_BASE_ROUTE}/sections/${encodeURIComponent(sectionKey)}/products/${encodeURIComponent(productId)}`
  );
  return assertMealBuilderCardActionResponse(response.data);
};

export const updateMealBuilderDraft = async (
  payload: MealBuilderDraftPayload
): Promise<MealBuilderConfigResponse> => {
  const response = await api.put(`${MEAL_BUILDER_BASE_ROUTE}/draft`, payload);
  return response.data;
};

export const validateMealBuilderDraft = async (
  payload?: Partial<MealBuilderDraftPayload>
): Promise<MealBuilderValidationResponse> => {
  const response = await api.post(
    `${MEAL_BUILDER_BASE_ROUTE}/validate`,
    payload ?? {}
  );
  return response.data;
};

export const publishMealBuilderDraft = async (
  notes?: string
): Promise<MealBuilderPublishResponse> => {
  const response = await api.post(`${MEAL_BUILDER_BASE_ROUTE}/publish`, {
    notes,
  });
  return response.data;
};

export const getMealBuilderReadiness =
  async (): Promise<MealBuilderReadinessResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/readiness`);
    return response.data;
  };

export const getPublicMealBuilderContract =
  async (): Promise<MealBuilderPublishResponse["data"]["contract"] | null> => {
    const response = await api.get("/api/subscriptions/meal-builder", {
      skipAuthRedirect: true,
    });
    return response.data?.data ?? null;
  };

export const getSubscriptionPlannerMenuPreview = fetchMealPlannerMenuPreview;

export const publishMealBuilder = publishMealBuilderDraft;

export function assertMealBuilderCardActionResponse(
  value: unknown
): MealBuilderCardActionResponse {
  if (!isRecord(value)) {
    throw new Error("Invalid Meal Builder card action response");
  }
  const data = value.data;
  if (
    value.status !== true ||
    !isRecord(data) ||
    data.contractVersion !== "dashboard_meal_builder_card_action.v1" ||
    !isRecord(data.draft) ||
    !Array.isArray((data.draft as { sections?: unknown }).sections) ||
    !isRecord(data.validation)
  ) {
    throw new Error("Meal Builder card action contract mismatch");
  }
  return value as unknown as MealBuilderCardActionResponse;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
