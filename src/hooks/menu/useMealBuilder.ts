import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  createMealBuilderDraft,
  getMealBuilder,
  getMealBuilderHydratedDraft,
  getMealBuilderPicker,
  getMealBuilderReadiness,
  publishMealBuilderDraft,
  updateMealBuilderDraft,
  validateMealBuilderDraft,
} from "@/utils/fetchMealBuilder";
import type {
  MealBuilderDraftPayload,
  MealBuilderPickerParams,
} from "@/types/mealBuilderTypes";

export const MEAL_BUILDER_KEY = "dashboard.meal-builder";
export const MEAL_BUILDER_HYDRATED_KEY = "dashboard.meal-builder.hydrated";
export const MEAL_BUILDER_READINESS_KEY = "dashboard.meal-builder.readiness";
export const MEAL_BUILDER_PICKER_KEY = "dashboard.meal-builder.picker";

const mealBuilderInvalidateKeys = [
  [MEAL_BUILDER_KEY],
  [MEAL_BUILDER_HYDRATED_KEY],
  [MEAL_BUILDER_READINESS_KEY],
];

export const mealBuilderQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_BUILDER_KEY],
    queryFn: getMealBuilder,
    staleTime: 1000 * 30,
  });

export const mealBuilderReadinessQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_BUILDER_READINESS_KEY],
    queryFn: getMealBuilderReadiness,
    staleTime: 1000 * 30,
  });

export const mealBuilderHydratedQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_BUILDER_HYDRATED_KEY],
    queryFn: getMealBuilderHydratedDraft,
    staleTime: 1000 * 20,
  });

export const mealBuilderPickerQueryOptions = (
  sectionKey: string,
  params: MealBuilderPickerParams
) =>
  queryOptions({
    queryKey: [MEAL_BUILDER_PICKER_KEY, sectionKey, params],
    queryFn: () => getMealBuilderPicker(sectionKey, params),
    enabled: Boolean(sectionKey),
    staleTime: 1000 * 15,
  });

export const useMealBuilderQuery = () => useQuery(mealBuilderQueryOptions());

export const useMealBuilderHydratedQuery = () =>
  useQuery(mealBuilderHydratedQueryOptions());

export const useMealBuilderPickerQuery = (
  sectionKey: string,
  params: MealBuilderPickerParams
) => useQuery(mealBuilderPickerQueryOptions(sectionKey, params));

export const useMealBuilderReadinessQuery = () =>
  useQuery(mealBuilderReadinessQueryOptions());

export const useCreateMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: createMealBuilderDraft,
    successMessage: "تم إنشاء مسودة منشئ الوجبات",
    invalidateKeys: mealBuilderInvalidateKeys,
  });

export const useSaveMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: updateMealBuilderDraft,
    successMessage: "تم حفظ مسودة منشئ الوجبات",
    invalidateKeys: mealBuilderInvalidateKeys,
  });

export const useValidateMealBuilderDraftMutation = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: (payload?: Partial<MealBuilderDraftPayload>) =>
      validateMealBuilderDraft(payload),
    successMessage: (data) =>
      data.data.ready
        ? "المسودة جاهزة للنشر"
        : "تم التحقق، توجد ملاحظات تحتاج مراجعة",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_KEY] });
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_HYDRATED_KEY] });
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_READINESS_KEY] });
    },
  });
};

export const usePublishMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: publishMealBuilderDraft,
    successMessage: "تم نشر منشئ الوجبات للموبايل",
    invalidateKeys: [
      ...mealBuilderInvalidateKeys,
      ["menu.mealPlannerPreview"],
    ],
  });
