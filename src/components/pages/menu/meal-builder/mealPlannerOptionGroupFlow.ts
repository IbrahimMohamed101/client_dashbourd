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

/**
 * A group is authorable when the backend catalog provides the canonical
 * product/group context and a supported option role. The `eligible` flag is a
 * current availability/validation signal; it must not disable the authoring UI
 * before the user can choose options. The create/update mutation remains the
 * final validation boundary.
 */
export function matchingEligibleBuilderGroups(
  menuGroupId: string,
  builderGroups: MealPlannerBuilderGroup[]
) {
  return builderGroups.filter(
    (group) =>
      String(group.sourceGroupId) === String(menuGroupId) &&
      Boolean(group.productContextId) &&
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

/**
 * MenuOptionGroup is the canonical visible option source for card authoring.
 * When the optional Meal Builder picker returns a matching row we preserve its
 * assignment/availability metadata. When it does not, the MenuOption itself is
 * still a valid selectable ID and the create/update mutation remains the final
 * backend validation boundary.
 */
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
    const matches = candidatesByKey.get(key) || [];
    matches.push(candidate);
    candidatesByKey.set(key, matches);
  }

  const rows: MealPlannerCatalogCandidate[] = menuOptions.map((option) => {
    const keyMatches = candidatesByKey.get(String(option.key || "").trim()) || [];
    const authoritative =
      pickerById.get(option.id) || (keyMatches.length === 1 ? keyMatches[0] : undefined);
    const id = authoritative ? canonicalPickerOptionId(authoritative) : option.id;
    const selected =
      selectedIds.includes(id) ||
      selectedIds.includes(option.id) ||
      authoritative?.selected === true;
    const menuFallback = !authoritative;

    return {
      id,
      optionId: id,
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
      assignable: menuFallback ? true : authoritative.assignable === true,
      eligible: menuFallback ? true : authoritative.eligible === true,
      state: menuFallback ? "menu_option" : authoritative.state,
      reasonCodes: menuFallback ? [] : authoritative.reasonCodes,
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
