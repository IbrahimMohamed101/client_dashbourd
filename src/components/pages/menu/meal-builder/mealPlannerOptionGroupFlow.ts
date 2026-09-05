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

function optionFamily(option: MenuOption) {
  return String(option.proteinFamilyKey || option.displayCategoryKey || "")
    .trim()
    .toLowerCase();
}

function hasPremiumClassification(option: MenuOption) {
  return Boolean(
    String(option.premiumKey || "").trim() ||
      ["premium_meal", "premium_large_salad"].includes(
        String(option.selectionType || "").trim().toLowerCase()
      )
  );
}

function isGloballyVisibleOption(option: MenuOption) {
  const availableForSubscription = option.availableForSubscription !== false;
  const availableFor = Array.isArray(option.availableFor) ? option.availableFor : [];
  const subscriptionChannelAllowed =
    availableFor.length === 0 || availableFor.includes("subscription");

  return (
    option.isActive !== false &&
    option.isVisible !== false &&
    option.isAvailable !== false &&
    availableForSubscription &&
    subscriptionChannelAllowed &&
    !hasPremiumClassification(option)
  );
}

function isGloballyAttachableOption(option: MenuOption, familyKey = "") {
  const normalizedFamilyKey = String(familyKey || "").trim().toLowerCase();
  const explicitProteinFamily = String(option.proteinFamilyKey || "")
    .trim()
    .toLowerCase();
  const explicitDisplayCategory = String(option.displayCategoryKey || "")
    .trim()
    .toLowerCase();
  const hasExplicitFamilyMetadata = Boolean(
    explicitProteinFamily || explicitDisplayCategory
  );

  // A legacy/newly-created standard protein with no family metadata is still
  // safe to offer in a specific family card. The backend completes the family
  // metadata only after verifying the exact option group and requested family.
  // Never infer a family from the option name/key, and never override an
  // explicit conflicting classification.
  const familyMatches =
    !normalizedFamilyKey ||
    (!hasExplicitFamilyMetadata && Boolean(normalizedFamilyKey)) ||
    optionFamily(option) === normalizedFamilyKey;

  return isGloballyVisibleOption(option) && familyMatches;
}

/**
 * ProductGroupOption-backed picker rows remain the authoritative state for
 * already-attached choices. Every regular option from the selected MenuOption
 * group is also rendered in the picker so the card stays a dynamic view of its
 * source group. For protein cards, the selected family controls which rows are
 * actually selectable: matching/unclassified options are attachable on save;
 * explicitly conflicting families stay visible but disabled. Premium/system-
 * managed options remain protected and are never exposed by this fallback.
 */
export function mergeMenuOptionsWithPicker(
  menuOptions: MenuOption[],
  pickerCandidates: MealPlannerCatalogCandidate[],
  selectedIds: string[],
  familyKey = ""
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
    if (authoritativeIds.has(option.id)) continue;
    const selected = selectedIds.includes(option.id);
    const attachable = isGloballyAttachableOption(option, familyKey);
    const visible = isGloballyVisibleOption(option);
    if (!visible && !selected) continue;

    const hasExplicitFamilyMetadata = Boolean(
      String(option.proteinFamilyKey || "").trim() ||
        String(option.displayCategoryKey || "").trim()
    );
    const normalizedFamilyKey = String(familyKey || "").trim().toLowerCase();
    const explicitFamily = optionFamily(option);
    const familyConflict = Boolean(
      normalizedFamilyKey &&
        hasExplicitFamilyMetadata &&
        explicitFamily &&
        explicitFamily !== normalizedFamilyKey
    );

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
      selected,
      assignable: attachable,
      eligible: attachable,
      linked: false,
      relationExists: false,
      attachable,
      classificationPending: !hasExplicitFamilyMetadata && Boolean(normalizedFamilyKey),
      state: attachable ? "attachable_on_save" : "not_attachable_to_product",
      reasonCodes: attachable
        ? [
            "ATTACH_TO_PRODUCT_ON_SAVE",
            ...(!hasExplicitFamilyMetadata && normalizedFamilyKey
              ? ["CLASSIFY_FAMILY_ON_SAVE"]
              : []),
          ]
        : familyConflict
          ? ["OPTION_FAMILY_MISMATCH"]
          : ["OPTION_RELATION_UNAVAILABLE"],
      sortOrder: option.sortOrder,
    });
  }

  return rows.sort((left, right) => {
    const leftSelected = selectedIds.includes(canonicalPickerOptionId(left)) ? 1 : 0;
    const rightSelected = selectedIds.includes(canonicalPickerOptionId(right)) ? 1 : 0;
    return (
      rightSelected - leftSelected ||
      Number(right.assignable === true) - Number(left.assignable === true) ||
      Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0)
    );
  });
}

export function menuGroupLabel(group: MenuOptionGroup) {
  return group.name?.ar || group.name?.en || group.key || group.id;
}
