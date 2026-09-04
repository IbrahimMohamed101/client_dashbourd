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
 * Prefer contexts explicitly marked eligible. If the backend catalog contains
 * only structurally valid contexts with `eligible: false`, keep the editor
 * usable and let the create/update mutation perform the final validation.
 */
export function matchingEligibleBuilderGroups(
  menuGroupId: string,
  builderGroups: MealPlannerBuilderGroup[]
) {
  const validContexts = builderGroups.filter(
    (group) =>
      String(group.sourceGroupId) === String(menuGroupId) &&
      Boolean(group.productContextId) &&
      (group.optionRole === "protein" || group.optionRole === "carbs")
  );
  const explicitlyEligible = validContexts.filter((group) => group.eligible === true);
  if (explicitlyEligible.length) return explicitlyEligible;

  // The same catalog objects are consumed by the dialog's supported-context
  // guard later in the render. Normalize this authoring-only fallback so a
  // stale eligibility flag cannot disable every option in the UI.
  for (const group of validContexts) group.eligible = true;
  return validContexts;
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
 * ProductGroupOption-backed picker rows are the only selectable authority.
 * Global MenuOption rows may enrich labels, but never grant product membership.
 * A selected legacy row that is no longer attached remains visible only so the
 * employee can remove it from the card.
 */
export function mergeMenuOptionsWithPicker(
  menuOptions: MenuOption[],
  pickerCandidates: MealPlannerCatalogCandidate[],
  selectedIds: string[]
): MealPlannerCatalogCandidate[] {
  const menuById = new Map(menuOptions.map((option) => [String(option.id), option]));
  const rows: MealPlannerCatalogCandidate[] = pickerCandidates
    .map((candidate) => {
      const id = canonicalPickerOptionId(candidate);
      if (!id) return null;
      const option = menuById.get(id);
      return {
        ...(option
          ? {
              key: option.key,
              name: option.name,
              imageUrl: option.imageUrl,
              extraPriceHalala: option.extraPriceHalala,
              displayCategoryKey: option.displayCategoryKey,
              proteinFamilyKey: option.proteinFamilyKey,
              familyKey: option.proteinFamilyKey || option.displayCategoryKey,
              sortOrder: option.sortOrder,
            }
          : {}),
        ...candidate,
        id,
        optionId: id,
        type: "option" as const,
        selected: selectedIds.includes(id) || candidate.selected === true,
      };
    })
    .filter(Boolean) as MealPlannerCatalogCandidate[];

  const authoritativeIds = new Set(rows.map((option) => canonicalPickerOptionId(option)));
  for (const option of menuOptions) {
    if (!selectedIds.includes(option.id) || authoritativeIds.has(option.id)) continue;
    rows.push({
      id: option.id,
      optionId: option.id,
      key: option.key,
      type: "option",
      name: option.name,
      imageUrl: option.imageUrl,
      extraPriceHalala: option.extraPriceHalala,
      displayCategoryKey: option.displayCategoryKey,
      proteinFamilyKey: option.proteinFamilyKey,
      familyKey: option.proteinFamilyKey || option.displayCategoryKey,
      selected: true,
      assignable: false,
      eligible: false,
      linked: false,
      relationExists: false,
      relationStatus: { exists: false, effective: false },
      state: "not_attached_to_product",
      reasonCodes: ["OPTION_RELATION_UNAVAILABLE"],
      sortOrder: option.sortOrder,
    });
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
