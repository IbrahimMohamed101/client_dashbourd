import api from "@/lib/apis";
import { fetchMealPlannerMenuPreview } from "@/utils/fetchMealPlannerMenu";
import type {
  MealBuilderConfigResponse,
  MealBuilderDraftPayload,
  MealBuilderPublishResponse,
  MealBuilderReadinessResponse,
  MealBuilderStateResponse,
  MealBuilderValidationResponse,
} from "@/types/mealBuilderTypes";

export const getMealBuilder = async (): Promise<MealBuilderStateResponse> => {
  const response = await api.get("/api/dashboard/meal-builder");
  logMealBuilderDev("GET /api/dashboard/meal-builder", response.data);
  return response.data;
};

export const createMealBuilderDraft =
  async (): Promise<MealBuilderConfigResponse> => {
    const response = await api.post("/api/dashboard/meal-builder/draft");
    logMealBuilderDev("POST /api/dashboard/meal-builder/draft", response.data);
    return response.data;
  };

export const updateMealBuilderDraft = async (
  payload: MealBuilderDraftPayload
): Promise<MealBuilderConfigResponse> => {
  const response = await api.put("/api/dashboard/meal-builder/draft", payload);
  return response.data;
};

export const validateMealBuilderDraft = async (
  payload?: Partial<MealBuilderDraftPayload>
): Promise<MealBuilderValidationResponse> => {
  const response = await api.post(
    "/api/dashboard/meal-builder/validate",
    payload ?? {}
  );
  return response.data;
};

export const publishMealBuilderDraft = async (
  notes?: string
): Promise<MealBuilderPublishResponse> => {
  const response = await api.post("/api/dashboard/meal-builder/publish", {
    notes,
  });
  return response.data;
};

export const getMealBuilderReadiness =
  async (): Promise<MealBuilderReadinessResponse> => {
    const response = await api.get("/api/dashboard/meal-builder/readiness");
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
