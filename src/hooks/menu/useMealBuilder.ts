import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  addMealBuilderProducts,
  createMealBuilderProductSection,
  createMealBuilderDraft,
  deleteMealBuilderProductSection,
  getMealBuilder,
  getMealBuilderDraft,
  getMealBuilderHydratedDraft,
  getMealBuilderPicker,
  getMealBuilderReadiness,
  getPublishedMealBuilder,
  publishMealBuilderDraft,
  removeMealBuilderProduct,
  resetMealBuilderDraft,
  updateMealBuilderProductSection,
  updateMealBuilderDraft,
  validateMealBuilderDraft,
} from "@/utils/fetchMealBuilder";
import type {
  MealBuilderAddProductsPayload,
  MealBuilderCardActionResponse,
  MealBuilderConfig,
  MealBuilderDirectCardPatchPayload,
  MealBuilderDraftPayload,
  MealBuilderLifecycleResponse,
  MealBuilderLifecycleResponseData,
  MealBuilderPickerParams,
} from "@/types/mealBuilderTypes";
import { mealBuilderErrorMessage } from "@/components/pages/menu/meal-builder/mealBuilderFrontendUtils";
import { MEAL_PLANNER_MENU_PREVIEW_KEY } from "./useMealPlannerMenuPreview";

export const MEAL_BUILDER_KEY = "dashboard.meal-builder";
export const MEAL_BUILDER_PUBLISHED_KEY = "dashboard.meal-builder.published";
export const MEAL_BUILDER_DRAFT_KEY = "dashboard.meal-builder.draft";
export const MEAL_BUILDER_HYDRATED_KEY = "dashboard.meal-builder.hydrated";
export const MEAL_BUILDER_READINESS_KEY = "dashboard.meal-builder.readiness";
export const MEAL_BUILDER_PICKER_KEY = "dashboard.meal-builder.picker";

const mealBuilderInvalidateKeys = [
  [MEAL_BUILDER_KEY],
  [MEAL_BUILDER_DRAFT_KEY],
  [MEAL_BUILDER_HYDRATED_KEY],
  [MEAL_BUILDER_READINESS_KEY],
  [MEAL_BUILDER_PICKER_KEY],
];

export const mealBuilderQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_BUILDER_KEY],
    queryFn: async () => {
      const response = await getMealBuilder();
      const draft = response.data.draft as VersionedMealBuilderConfig | null;
      const published = response.data.published as VersionedMealBuilderConfig | null;

      return {
        ...response,
        data: {
          ...response.data,
          metadata: response.data.metadata ?? {
            mode: draft ? "draft" : "published",
            versionId:
              draft?.versionId ??
              draft?.id ??
              published?.versionId ??
              published?.id ??
              null,
            draftVersionId: draft?.versionId ?? draft?.id ?? null,
            versionNumber: draft?.versionNumber ?? published?.versionNumber ?? null,
            basedOnPublishedVersionId: draft?.basedOnPublishedVersionId ?? null,
            hasDraft: Boolean(draft),
            hasUnpublishedChanges:
              draft?.hasUnpublishedChanges ?? Boolean(draft),
            publishedAt: published?.publishedAt ?? null,
            updatedAt: draft?.updatedAt ?? published?.updatedAt ?? null,
            status: draft?.status ?? published?.status ?? null,
          },
        },
      };
    },
    staleTime: 1000 * 30,
  });

export const mealBuilderPublishedQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_BUILDER_PUBLISHED_KEY],
    queryFn: async (): Promise<MealBuilderLifecycleResponse> => {
      const response = await getPublishedMealBuilder();
      const rawData = response.data as MealBuilderLifecycleResponseData | null;
      const config = rawData?.config as
        | VersionedMealBuilderConfig
        | null
        | undefined;

      return {
        ...response,
        data: {
          ...(rawData ?? {}),
          config: config ?? null,
          premiumSection: rawData?.premiumSection ?? rawData?.contract?.premiumSection ?? null,
          versionId: config?.versionId ?? config?.id ?? null,
          versionNumber: config?.versionNumber ?? null,
          basedOnPublishedVersionId: config?.basedOnPublishedVersionId ?? null,
          publishedAt: config?.publishedAt ?? null,
          updatedAt: config?.updatedAt ?? null,
        },
      };
    },
    staleTime: 1000 * 30,
  });

export const mealBuilderDraftQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: [MEAL_BUILDER_DRAFT_KEY],
    queryFn: async (): Promise<MealBuilderLifecycleResponse> => {
      const response = await getMealBuilderDraft();
      const config = response.data as unknown as VersionedMealBuilderConfig;
      return {
        ...response,
        data: {
          config,
          draft: config,
          mode: config.mode ?? "draft",
          versionId: config.versionId ?? config.id ?? null,
          draftVersionId: config.versionId ?? config.id ?? null,
          versionNumber: config.versionNumber ?? null,
          basedOnPublishedVersionId: config.basedOnPublishedVersionId ?? null,
          hasDraft: true,
          hasUnpublishedChanges: config.hasUnpublishedChanges ?? true,
          publishedAt: config.publishedAt ?? null,
          updatedAt: config.updatedAt ?? null,
          status: config.status ?? "draft",
        },
      };
    },
    enabled,
    staleTime: 1000 * 20,
  });

export const mealBuilderReadinessQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_BUILDER_READINESS_KEY],
    queryFn: getMealBuilderReadiness,
    staleTime: 1000 * 30,
  });

export const mealBuilderHydratedQueryOptions = (enabled = true) =>
  queryOptions({
    queryKey: [MEAL_BUILDER_HYDRATED_KEY],
    queryFn: getMealBuilderHydratedDraft,
    enabled,
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
    staleTime: 1000 * 10,
  });

export const useMealBuilderQuery = (enabled = true) =>
  useQuery({
    ...mealBuilderQueryOptions(),
    enabled,
  });

export const useMealBuilderPublishedQuery = () =>
  useQuery(mealBuilderPublishedQueryOptions());

export const useMealBuilderDraftQuery = (enabled = true) =>
  useQuery(mealBuilderDraftQueryOptions(enabled));

export const useMealBuilderHydratedQuery = (enabled = true) =>
  useQuery(mealBuilderHydratedQueryOptions(enabled));

export const useMealBuilderPickerQuery = (
  sectionKey: string,
  params: MealBuilderPickerParams
) => useQuery(mealBuilderPickerQueryOptions(sectionKey, params));

export const useMealBuilderReadinessQuery = () =>
  useQuery(mealBuilderReadinessQueryOptions());

export const useCreateMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: createMealBuilderDraft,
    successMessage: "تم إنشاء المسودة",
    errorMessage: (error) =>
      mealBuilderErrorMessage(error, "تعذر إنشاء مسودة منشئ الوجبات"),
    invalidateKeys: mealBuilderInvalidateKeys,
  });

export const useSaveMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: updateMealBuilderDraft,
    successMessage: "تم حفظ المسودة",
    errorMessage: (error) =>
      mealBuilderErrorMessage(error, "تعذر حفظ مسودة منشئ الوجبات"),
    invalidateKeys: mealBuilderInvalidateKeys,
  });

export const useResetMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: resetMealBuilderDraft,
    successMessage: "تمت إعادة المسودة لتطابق آخر نسخة منشورة",
    errorMessage: (error) =>
      mealBuilderErrorMessage(error, "تعذر إعادة المسودة"),
    invalidateKeys: mealBuilderInvalidateKeys,
  });

export const useValidateMealBuilderDraftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: Partial<MealBuilderDraftPayload>) =>
      validateMealBuilderDraft(payload),
    onSuccess: (response) => {
      const validation = response.data;
      if (validation.ready && validation.errors.length === 0) {
        toast.success(
          validation.warnings.length
            ? "المسودة جاهزة للنشر مع وجود تنبيهات"
            : "المسودة جاهزة للنشر"
        );
      } else {
        toast.error("المسودة تحتوي على أخطاء ويجب إصلاحها قبل النشر");
      }
      invalidateMealBuilderQueries(queryClient);
    },
    onError: (error) => {
      toast.error(
        mealBuilderErrorMessage(error, "تعذر فحص مسودة منشئ الوجبات")
      );
    },
  });
};

export const usePublishMealBuilderDraftMutation = () =>
  useMutationWithToast({
    mutationFn: publishMealBuilderDraft,
    successMessage: "تم نشر المسودة",
    errorMessage: (error) =>
      mealBuilderErrorMessage(error, "تعذر نشر مسودة منشئ الوجبات"),
    invalidateKeys: [
      ...mealBuilderInvalidateKeys,
      [MEAL_BUILDER_PUBLISHED_KEY],
      [MEAL_PLANNER_MENU_PREVIEW_KEY],
    ],
  });

export const useCreateMealBuilderProductSectionMutation = () =>
  useMealBuilderCardActionMutation({
    mutationFn: createMealBuilderProductSection,
    successMessage: "تم إنشاء بطاقة المنتجات",
  });

export const useUpdateMealBuilderProductSectionMutation = () =>
  useMealBuilderCardActionMutation({
    mutationFn: ({
      sectionKey,
      patch,
    }: {
      sectionKey: string;
      patch: MealBuilderDirectCardPatchPayload;
    }) => updateMealBuilderProductSection({ sectionKey, patch }),
    successMessage: "تم حفظ بطاقة المنتجات",
  });

export const useDeleteMealBuilderProductSectionMutation = () =>
  useMealBuilderCardActionMutation({
    mutationFn: deleteMealBuilderProductSection,
    successMessage: "تم حذف بطاقة المنتجات",
  });

export const useAddMealBuilderProductsMutation = () =>
  useMealBuilderCardActionMutation({
    mutationFn: ({
      sectionKey,
      productIds,
    }: MealBuilderAddProductsPayload & { sectionKey: string }) =>
      addMealBuilderProducts({ sectionKey, productIds }),
    successMessage: "تمت إضافة المنتجات",
  });

export const useRemoveMealBuilderProductMutation = () =>
  useMealBuilderCardActionMutation({
    mutationFn: ({
      sectionKey,
      productId,
    }: {
      sectionKey: string;
      productId: string;
    }) => removeMealBuilderProduct({ sectionKey, productId }),
    successMessage: "تم حذف المنتج من البطاقة",
  });

function invalidateMealBuilderQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  mealBuilderInvalidateKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

export function applyMealBuilderCardActionResult(
  queryClient: ReturnType<typeof useQueryClient>,
  response: MealBuilderCardActionResponse
) {
  const draft = response.data.draft;
  const validation = response.data.validation;
  queryClient.setQueryData([MEAL_BUILDER_DRAFT_KEY], {
    status: true,
    data: {
      config: draft,
      draft,
      mode: "draft",
      versionId: draft.id,
      draftVersionId: draft.id,
      versionNumber: null,
      basedOnPublishedVersionId: null,
      hasDraft: true,
      hasUnpublishedChanges: true,
      publishedAt: draft.publishedAt ?? null,
      updatedAt: draft.updatedAt ?? null,
      status: draft.status ?? "draft",
      validation,
    },
  } satisfies MealBuilderLifecycleResponse);
  queryClient.setQueryData([MEAL_BUILDER_HYDRATED_KEY], (current: unknown) => {
    if (!current || typeof current !== "object") return current;
    return {
      ...(current as Record<string, unknown>),
      data: {
        ...((current as { data?: Record<string, unknown> }).data ?? {}),
        draft,
        sections: draft.sections,
        validation,
        ready: validation.ready,
        errors: validation.errors,
        warnings: validation.warnings,
      },
    };
  });
  invalidateMealBuilderQueries(queryClient);
}

function useMealBuilderCardActionMutation<TVariables>({
  mutationFn,
  successMessage,
}: {
  mutationFn: (variables: TVariables) => Promise<MealBuilderCardActionResponse>;
  successMessage: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      applyMealBuilderCardActionResult(queryClient, response);
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(
        mealBuilderErrorMessage(error, "تعذر تنفيذ عملية بطاقة المنتجات")
      );
    },
  });
}

type VersionedMealBuilderConfig = MealBuilderConfig & {
  mode?: "published" | "draft" | string;
  versionId?: string | null;
  versionNumber?: number | string | null;
  basedOnPublishedVersionId?: string | null;
  hasUnpublishedChanges?: boolean;
};
