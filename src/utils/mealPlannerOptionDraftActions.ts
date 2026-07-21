import api from "@/lib/apis";
import type {
  MealPlannerCardActionResponseV2,
  MealPlannerConfigV2,
  MealPlannerCreatePayloadV2,
  MealPlannerPatchPayloadV2,
  MealPlannerSectionV2,
  MealPlannerStateResponseV2,
  MealPlannerValidationV2,
} from "@/types/mealPlannerDashboardTypes";

const ROUTE = "/api/dashboard/meal-builder";

type OptionPayload = Extract<MealPlannerCreatePayloadV2, { cardType: "option_family" }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function loadState(): Promise<MealPlannerStateResponseV2> {
  const response = await api.get(ROUTE, { params: { lang: "ar" } });
  if (!isRecord(response.data) || response.data.status !== true || !isRecord(response.data.data)) {
    throw new Error("تعذر تحميل مسودة منشئ الوجبات");
  }
  return response.data as unknown as MealPlannerStateResponseV2;
}

function optionSection(payload: OptionPayload, current?: MealPlannerSectionV2): MealPlannerSectionV2 {
  const role = payload.optionRole;
  const familyKey = String(payload.familyKey || "").trim().toLowerCase();
  return {
    ...(current || {}),
    key: payload.key,
    cardType: "option_family",
    sectionType: "option_group",
    sourceKind: "option_group",
    titleOverride: payload.titleOverride,
    productContextId: payload.productContextId,
    sourceGroupId: payload.sourceGroupId,
    selectedOptionIds: Array.from(new Set(payload.selectedOptionIds.map(String))),
    selectedProductIds: [],
    selectionType: "standard_meal",
    includeMode: "selected",
    sortOrder: payload.sortOrder,
    required: payload.required === true,
    minSelections: payload.minSelections ?? 0,
    maxSelections: payload.maxSelections ?? 1,
    multiSelect: payload.multiSelect === true,
    visible: payload.visible !== false,
    metadata: {
      ...(current?.metadata || {}),
      dashboardManaged: true,
      cardType: "option_family",
      visualRole: role === "carbs" ? "carbs" : "protein_family",
      optionRole: role,
      ...(familyKey ? { proteinFamilyKey: familyKey, familyKey } : {}),
    },
    rules: {
      ...(current?.rules || {}),
      minSelections: payload.minSelections ?? 0,
      maxSelections: payload.maxSelections ?? 1,
      isRequired: payload.required === true,
    },
  };
}

async function saveSections(
  sections: MealPlannerSectionV2[],
  state: MealPlannerStateResponseV2
): Promise<MealPlannerConfigV2> {
  const current = state.data.draft || state.data.published;
  const body = { sections, notes: current?.notes };
  const response = state.data.draft
    ? await api.put(`${ROUTE}/draft`, body)
    : await api.post(`${ROUTE}/draft`, body);
  if (!isRecord(response.data) || response.data.status !== true || !isRecord(response.data.data)) {
    throw new Error("تعذر حفظ مسودة منشئ الوجبات");
  }
  const draft = response.data.data as unknown as MealPlannerConfigV2;
  if (!Array.isArray(draft.sections)) throw new Error("استجابة المسودة غير صحيحة");
  return draft;
}

async function validation(): Promise<MealPlannerValidationV2> {
  const response = await api.post(`${ROUTE}/validate`, {});
  if (!isRecord(response.data) || response.data.status !== true || !isRecord(response.data.data)) {
    throw new Error("تعذر التحقق من مسودة منشئ الوجبات");
  }
  return response.data.data as unknown as MealPlannerValidationV2;
}

async function actionResponse(
  action: string,
  sectionKey: string | null,
  mutate: (sections: MealPlannerSectionV2[], state: MealPlannerStateResponseV2) => MealPlannerSectionV2[]
): Promise<MealPlannerCardActionResponseV2> {
  const state = await loadState();
  const current = state.data.draft || state.data.published;
  if (!current) throw new Error("لا توجد مسودة أو نسخة منشورة لمنشئ الوجبات");
  const sections = mutate([...(current.sections || [])], state);
  const draft = await saveSections(sections, state);
  const resultValidation = await validation();
  const section = sectionKey
    ? draft.sections.find((item) => item.key === sectionKey) || null
    : null;
  return {
    status: true,
    data: {
      contractVersion: "dashboard_meal_builder_card_action.v1",
      action,
      sectionKey,
      section,
      draft,
      validation: resultValidation,
      summary: {
        sectionCount: draft.sections.length,
        ready: resultValidation.ready === true,
        errorCount: resultValidation.errors?.length || 0,
        warningCount: resultValidation.warnings?.length || 0,
      },
    },
  } as MealPlannerCardActionResponseV2;
}

export function createOptionFamilyCard(payload: OptionPayload) {
  return actionResponse("created", payload.key, (sections) => {
    if (sections.some((section) => section.key === payload.key)) {
      throw new Error("مفتاح الكارت مستخدم بالفعل");
    }
    return [...sections, optionSection(payload)];
  });
}

export function updateOptionFamilyCard(
  sectionKey: string,
  patch: MealPlannerPatchPayloadV2
) {
  return actionResponse("updated", String((patch as OptionPayload).key || sectionKey), (sections) => {
    const index = sections.findIndex((section) => section.key === sectionKey);
    if (index < 0) throw new Error("كارت الوجبات غير موجود");
    const current = sections[index];
    const merged = {
      cardType: "option_family",
      key: String((patch as OptionPayload).key || current.key),
      titleOverride: (patch as OptionPayload).titleOverride || current.titleOverride || { ar: current.key, en: current.key },
      optionRole: (patch as OptionPayload).optionRole || (current.metadata?.optionRole as "protein" | "carbs") || "protein",
      productContextId: String((patch as OptionPayload).productContextId || current.productContextId || ""),
      sourceGroupId: String((patch as OptionPayload).sourceGroupId || current.sourceGroupId || ""),
      selectedOptionIds: (patch as OptionPayload).selectedOptionIds || current.selectedOptionIds || [],
      selectionType: "standard_meal",
      sortOrder: Number((patch as OptionPayload).sortOrder ?? current.sortOrder ?? 0),
      visible: (patch as OptionPayload).visible ?? current.visible ?? true,
      required: (patch as OptionPayload).required ?? current.required ?? false,
      minSelections: Number((patch as OptionPayload).minSelections ?? current.minSelections ?? 0),
      maxSelections: (patch as OptionPayload).maxSelections ?? current.maxSelections ?? 1,
      multiSelect: (patch as OptionPayload).multiSelect ?? current.multiSelect ?? false,
      familyKey: String((patch as OptionPayload).familyKey || current.metadata?.proteinFamilyKey || ""),
    } as OptionPayload;
    const next = [...sections];
    next[index] = optionSection(merged, current);
    return next;
  });
}

export function replaceOptionFamilyItems(sectionKey: string, optionIds: string[]) {
  return actionResponse("items_replaced", sectionKey, (sections) =>
    sections.map((section) =>
      section.key === sectionKey
        ? { ...section, selectedOptionIds: Array.from(new Set(optionIds.map(String))) }
        : section
    )
  );
}

export function addOptionFamilyItems(sectionKey: string, optionIds: string[]) {
  return actionResponse("options_added", sectionKey, (sections) =>
    sections.map((section) =>
      section.key === sectionKey
        ? {
            ...section,
            selectedOptionIds: Array.from(
              new Set([...(section.selectedOptionIds || []), ...optionIds].map(String))
            ),
          }
        : section
    )
  );
}

export function removeOptionFamilyItem(sectionKey: string, optionId: string) {
  return actionResponse("option_removed", sectionKey, (sections) =>
    sections.map((section) =>
      section.key === sectionKey
        ? {
            ...section,
            selectedOptionIds: (section.selectedOptionIds || []).filter(
              (id) => String(id) !== String(optionId)
            ),
          }
        : section
    )
  );
}

export async function deleteOptionFamilyCard(sectionKey: string) {
  const state = await loadState();
  const current = state.data.draft || state.data.published;
  const section = current?.sections.find((item) => item.key === sectionKey);
  if (!section || section.sectionType === "product_list") return null;
  return actionResponse("deleted", sectionKey, (sections) =>
    sections.filter((item) => item.key !== sectionKey)
  );
}
