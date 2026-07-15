import api from "@/lib/apis";
import { fetchMealPlannerMenuPreview } from "@/utils/fetchMealPlannerMenu";
import type {
  MealBuilderConfigResponse,
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
  logMealBuilderDev(`GET ${MEAL_BUILDER_BASE_ROUTE}`, response.data);
  return response.data;
};

export const getPublishedMealBuilder =
  async (): Promise<MealBuilderLifecycleResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/published`);
    logMealBuilderDev(`GET ${MEAL_BUILDER_BASE_ROUTE}/published`, response.data);
    return response.data;
  };

export const getMealBuilderDraft =
  async (): Promise<MealBuilderLifecycleResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/draft`);
    logMealBuilderDev(`GET ${MEAL_BUILDER_BASE_ROUTE}/draft`, response.data);
    return response.data;
  };

export const resetMealBuilderDraft =
  async (): Promise<MealBuilderLifecycleResponse> => {
    const response = await api.post(`${MEAL_BUILDER_BASE_ROUTE}/draft/reset`);
    logMealBuilderDev(`POST ${MEAL_BUILDER_BASE_ROUTE}/draft/reset`, response.data);
  return response.data;
};

export const getMealBuilderHydratedDraft =
  async (): Promise<MealBuilderHydratedDraftResponse> => {
    const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/draft/hydrated`);
    logMealBuilderDev(`GET ${MEAL_BUILDER_BASE_ROUTE}/draft/hydrated`, response.data);
    return response.data;
  };

export const getMealBuilderPicker = async (
  sectionKey: string,
  params: MealBuilderPickerParams = {}
): Promise<MealBuilderPickerResponse> => {
  const response = await api.get(`${MEAL_BUILDER_BASE_ROUTE}/pickers/${sectionKey}`, {
    params: {
      q: params.q || undefined,
      includeUnavailable: params.includeUnavailable,
      includeNotLinked: params.includeNotLinked,
      page: params.page,
      limit: params.limit,
    },
  });
  logMealBuilderDev(`GET ${MEAL_BUILDER_BASE_ROUTE}/pickers/${sectionKey}`, response.data);
  return response.data;
};

export const createMealBuilderDraft =
  async (): Promise<MealBuilderConfigResponse> => {
    const response = await api.post(`${MEAL_BUILDER_BASE_ROUTE}/draft`);
    logMealBuilderDev(`POST ${MEAL_BUILDER_BASE_ROUTE}/draft`, response.data);
    return response.data;
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

function logMealBuilderDev(label: string, value: unknown) {
  if (!import.meta.env.DEV) return;
  console.debug(`[meal-builder] ${label}`, value);
}
