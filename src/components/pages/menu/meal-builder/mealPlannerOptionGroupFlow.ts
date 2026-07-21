import type { MenuOption, MenuOptionGroup } from "@/types/menuTypes";
import type {
  MealPlannerBuilderGroup,
  MealPlannerCatalogCandidate,
} from "@/types/mealPlannerDashboardTypes";

export function optionRoleLabel(role?: string | null, lang: "ar" | "en" = "ar") {
  if (role === "protein") return lang === "ar" ? "بروتين" : "Protein";
  if (role === "carbs") return lang === "ar" ? "كارب" : "Carbs";
  return lang === "ar" ? "دور غير مدعوم" : "Unsupported role";
}

export function matchingEligibleBuilderGroups(
  menuGroupId: string,
  builderGroups: MealPlannerBuilderGroup[]
) {
  return builderGroups.filter(
    (group) =>
      group.sourceGroupId === menuGroupId &&
      group.eligible === true &&
      (group.optionRole === "protein" || group.optionRole === "carbs")
  );
}

export function isMenuGroupSaveable(
  menuGroup: MenuOptionGroup,
  builderGroups: MealPlannerBuilderGroup[]
) {
  return matchingEligibleBuilderGroups(menuGroup.id, builderGroups).length > 0;
}

export function builderGroupContextLabel(group: MealPlannerBuilderGroup) {
  return (
    group.product?.name?.ar ||
    group.product?.name?.en ||
    group.product?.key ||
    group.productContextId
  );
}

export function canonicalPickerOptionId(candidate: MealPlannerCatalogCandidate) {
  return String(candidate.optionId || candidate.id || candidate._id || "");
}

export function mergeMenuOptionsWithPicker(
  menuOptions: MenuOption[],
  pickerCandidates: MealPlannerCatalogCandidate[],
  selectedIds: string[]
): MealPlannerCatalogCandidate[] {
  const pickerById = new Map(
    pickerCandidates
      .map((candidate) => [canonicalPickerOptionId(candidate), candidate] as const)
      .filter(([id]) => Boolean(id))
  );

  const candidatesByKey = new Map<string, MealPlannerCatalogCandidate[]>();
  for (const candidate of pickerCandidates) {
    const key = String(candidate.key || "").trim();
    if (!key) continue;
    const rows = candidatesByKey.get(key) || [];
    rows.push(candidate);
    candidatesByKey.set(key, rows);
  }

  const rows: MealPlannerCatalogCandidate[] = menuOptions.map((option) => {
    const keyMatches = candidatesByKey.get(String(option.key || "").trim()) || [];
    const authoritative =
      pickerById.get(option.id) || (keyMatches.length === 1 ? keyMatches[0] : undefined);
    const authoritativeId = authoritative
      ? canonicalPickerOptionId(authoritative)
      : option.id;
    const selected =
      selectedIds.includes(authoritativeId) ||
      selectedIds.includes(option.id) ||
      authoritative?.selected === true;

    return {
      id: authoritativeId,
      optionId: authoritativeId,
      key: option.key,
      type: "option",
      name: option.name,
      imageUrl: option.imageUrl,
      extraPriceHalala: option.extraPriceHalala,
      displayCategoryKey: option.displayCategoryKey,
      proteinFamilyKey: option.proteinFamilyKey,
      familyKey: option.proteinFamilyKey || option.displayCategoryKey,
      selected,
      assigned: authoritative?.assigned,
      assignedSectionKey: authoritative?.assignedSectionKey,
      assignable: authoritative?.assignable === true,
      eligible: authoritative?.eligible === true,
      state: authoritative?.state || "not_in_authoritative_picker",
      reasonCodes: authoritative?.reasonCodes || ["NO_AUTHORITATIVE_CANDIDATE"],
      relationStatus: authoritative?.relationStatus,
      effectiveStatus: authoritative?.effectiveStatus,
      currency: authoritative?.currency,
      sortOrder: option.sortOrder,
    };
  });

  const menuIds = new Set(rows.map((option) => canonicalPickerOptionId(option)));
  for (const candidate of pickerCandidates) {
    const id = canonicalPickerOptionId(candidate);
    if (!id || menuIds.has(id) || !selectedIds.includes(id)) continue;
    rows.push({ ...candidate, id, optionId: id, selected: true });
  }

  return rows.sort((left, right) => {
    const leftSelected = selectedIds.includes(canonicalPickerOptionId(left)) ? 1 : 0;
    const rightSelected = selectedIds.includes(canonicalPickerOptionId(right)) ? 1 : 0;
    return (
      rightSelected - leftSelected ||
      Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0)
    );
  });
}

export function menuGroupLabel(group: MenuOptionGroup) {
  return group.name?.ar || group.name?.en || group.key || group.id;
}
