import api from "@/lib/apis";
import type {
  MealPlannerCardActionResponseV2,
  MealPlannerCreatePayloadV2,
  MealPlannerPatchPayloadV2,
} from "@/types/mealPlannerDashboardTypes";

const ROUTE = "/api/dashboard/meal-builder";
const SUPPORTED_CARD_ACTION_CONTRACTS = new Set([
  "dashboard_meal_builder_card_action.v1",
  "dashboard_meal_builder_card_action.v2",
]);

type OptionPayload = Extract<
  MealPlannerCreatePayloadV2,
  { cardType: "option_family" }
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertActionResponse(value: unknown): MealPlannerCardActionResponseV2 {
  if (!isRecord(value) || value.status !== true || !isRecord(value.data)) {
    throw new Error("استجابة منشئ الوجبات من الـBackend غير صحيحة");
  }

  const data = value.data;
  const contractVersion = String(data.contractVersion || "");
  if (
    !SUPPORTED_CARD_ACTION_CONTRACTS.has(contractVersion) ||
    !isRecord(data.draft) ||
    !Array.isArray(data.draft.sections) ||
    !isRecord(data.validation)
  ) {
    throw new Error("عقد إجراءات منشئ الوجبات غير متوافق");
  }

  return value as unknown as MealPlannerCardActionResponseV2;
}

/**
 * Option-family cards used to rebuild and PUT the entire Meal Builder draft in
 * the browser. Keep all mutations authoritative on the backend instead: the
 * backend reloads the latest draft, validates context/group/family membership,
 * blocks system-managed Premium cards, and returns the canonical draft.
 */
export async function createOptionFamilyCard(
  payload: OptionPayload
): Promise<MealPlannerCardActionResponseV2> {
  const response = await api.post(`${ROUTE}/sections`, payload);
  return assertActionResponse(response.data);
}

export async function updateOptionFamilyCard(
  sectionKey: string,
  patch: MealPlannerPatchPayloadV2
): Promise<MealPlannerCardActionResponseV2> {
  const response = await api.patch(
    `${ROUTE}/sections/${encodeURIComponent(sectionKey)}`,
    patch
  );
  return assertActionResponse(response.data);
}

export async function replaceOptionFamilyItems(
  sectionKey: string,
  optionIds: string[]
): Promise<MealPlannerCardActionResponseV2> {
  const response = await api.put(
    `${ROUTE}/sections/${encodeURIComponent(sectionKey)}/items`,
    { optionIds: Array.from(new Set(optionIds.map(String))) }
  );
  return assertActionResponse(response.data);
}

export async function addOptionFamilyItems(
  sectionKey: string,
  optionIds: string[]
): Promise<MealPlannerCardActionResponseV2> {
  const response = await api.post(
    `${ROUTE}/sections/${encodeURIComponent(sectionKey)}/options`,
    { optionIds: Array.from(new Set(optionIds.map(String))) }
  );
  return assertActionResponse(response.data);
}

export async function removeOptionFamilyItem(
  sectionKey: string,
  optionId: string
): Promise<MealPlannerCardActionResponseV2> {
  const response = await api.delete(
    `${ROUTE}/sections/${encodeURIComponent(sectionKey)}/options/${encodeURIComponent(optionId)}`
  );
  return assertActionResponse(response.data);
}

export async function deleteOptionFamilyCard(
  sectionKey: string
): Promise<MealPlannerCardActionResponseV2> {
  const response = await api.delete(
    `${ROUTE}/sections/${encodeURIComponent(sectionKey)}`
  );
  return assertActionResponse(response.data);
}
