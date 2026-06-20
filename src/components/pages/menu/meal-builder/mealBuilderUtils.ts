import type {
  LocalizedText,
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type {
  MealBuilderCheck,
  MealBuilderSection,
  MealBuilderSectionType,
  MealBuilderValidation,
} from "@/types/mealBuilderTypes";
import {
  PREMIUM_REQUIRED_KEYS,
  REQUIRED_SECTION_ORDER,
  SELECTION_TYPES,
  VISUAL_SECTION_LABELS,
} from "./mealBuilderConstants";

export function emptySection(type: MealBuilderSectionType): MealBuilderSection {
  return {
    sectionType: type,
    productContextId: null,
    sourceGroupId: null,
    sourceCategoryId: null,
    selectedOptionIds: [],
    selectedProductIds: [],
    includeMode: type === "product_category" ? "all" : "selected",
    selectionType:
      type === "product_list"
        ? "premium_large_salad"
        : type === "product_category"
          ? "sandwich"
          : "standard_meal",
    titleOverride: { ar: "", en: "" },
    sortOrder: 1,
    required: false,
    minSelections: 0,
    maxSelections: null,
    multiSelect: false,
    visible: true,
    availableFor: ["subscription"],
  };
}

export function toBackendSections(sections: MealBuilderSection[]) {
  return orderSections(sections).map((section, index) => ({
    key: section.key,
    sectionType: section.sectionType,
    sourceKind: section.sourceKind,
    productContextId: section.productContextId || null,
    sourceGroupId: section.sourceGroupId || null,
    sourceCategoryId: section.sourceCategoryId || null,
    selectedOptionIds: section.selectedOptionIds,
    selectedProductIds: section.selectedProductIds,
    includeMode: section.includeMode,
    selectionType: section.selectionType,
    titleOverride: section.titleOverride,
    sortOrder: index + 1,
    required: section.required,
    minSelections: Number(section.minSelections || 0),
    maxSelections: section.maxSelections,
    multiSelect: section.multiSelect,
    visible: section.visible,
    availableFor: ["subscription"],
    metadata: section.metadata,
    rules: section.rules,
  }));
}

export function moveSection(
  sections: MealBuilderSection[],
  index: number,
  direction: "up" | "down"
) {
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sections.length) return sections;
  const next = [...sections];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function issuesForSection(
  validation: MealBuilderValidation | null,
  index: number,
  type: MealBuilderSectionType
): MealBuilderCheck[] {
  return (
    validation?.checks.filter(
      (issue) =>
        Number(issue.sectionIndex) === index || issue.sectionType === type
    ) ?? []
  );
}

export function visualSectionKey(
  section: MealBuilderSection,
  options: MenuOption[] = [],
  products: MenuProduct[] = []
) {
  const explicit = String(
    (section as MealBuilderSection & { key?: string }).key || ""
  ).toLowerCase();
  if (explicit) return explicit;

  const text =
    `${section.titleOverride.en} ${section.titleOverride.ar} ${section.selectionType}`.toLowerCase();
  if (text.includes("premium") || text.includes("مميز")) return "premium";
  if (text.includes("sandwich") || text.includes("ساند")) return "sandwich";
  if (text.includes("carb") || text.includes("نشو")) return "carbs";
  if (text.includes("beef") || text.includes("لحم")) return "beef";
  if (text.includes("fish") || text.includes("سمك")) return "fish";
  if (text.includes("egg") || text.includes("بيض")) return "eggs";
  if (text.includes("chicken") || text.includes("دجاج")) return "chicken";

  const selectedOptions = options.filter((option) =>
    section.selectedOptionIds.includes(option.id)
  );
  const selectedProducts = products.filter((product) =>
    section.selectedProductIds.includes(product.id)
  );
  const keys = [...selectedOptions, ...selectedProducts]
    .map(
      (item) =>
        `${item.key} ${(item as MenuOption).proteinFamilyKey ?? ""} ${
          (item as MenuOption).displayCategoryKey ?? ""
        }`
    )
    .join(" ")
    .toLowerCase();

  if (
    keys.includes("beef_steak") ||
    keys.includes("shrimp") ||
    keys.includes("salmon") ||
    keys.includes("premium_large_salad")
  )
    return "premium";
  if (keys.includes("sandwich")) return "sandwich";
  if (
    keys.includes("carb") ||
    keys.includes("rice") ||
    keys.includes("pasta") ||
    keys.includes("potato")
  )
    return "carbs";
  if (keys.includes("beef") || keys.includes("meat")) return "beef";
  if (keys.includes("fish") || keys.includes("tuna")) return "fish";
  if (keys.includes("egg")) return "eggs";
  if (keys.includes("chicken")) return "chicken";

  return section.sectionType;
}

export function visualSectionLabel(key: string) {
  return VISUAL_SECTION_LABELS[key] ?? { ar: key, en: key };
}

export function orderWarnings(
  sections: MealBuilderSection[],
  options: MenuOption[],
  products: MenuProduct[]
) {
  const actual = orderSections(sections).map((section) =>
    visualSectionKey(section, options, products)
  );
  const warnings: string[] = [];

  REQUIRED_SECTION_ORDER.forEach((key, index) => {
    if (actual[index] !== key) {
      warnings.push(
        `الترتيب المتوقع: ${REQUIRED_SECTION_ORDER.join(
          "، "
        )}. الترتيب الحالي: ${actual.join("، ") || "فارغ"}.`
      );
    }
  });

  if (actual[actual.length - 1] !== "carbs") {
    warnings.push("قسم النشويات يجب أن يكون ظاهرا وآخر قسم في المسودة.");
  }

  return [...new Set(warnings)];
}

export function premiumMissingKeys(
  section: MealBuilderSection,
  options: MenuOption[],
  products: MenuProduct[]
) {
  const selectedKeys = [
    ...options
      .filter((option) => section.selectedOptionIds.includes(option.id))
      .map((option) => option.key),
    ...products
      .filter((product) => section.selectedProductIds.includes(product.id))
      .map((product) => product.key),
  ];
  return PREMIUM_REQUIRED_KEYS.filter((key) => !selectedKeys.includes(key));
}

export function orderSections(sections: MealBuilderSection[]) {
  return [...sections].sort(
    (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
  );
}

export function toggle(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function matches(item: { key: string; name: LocalizedText }, query: string) {
  const value = query.trim().toLowerCase();
  if (!value) return true;
  return `${item.key} ${item.name.ar} ${item.name.en}`
    .toLowerCase()
    .includes(value);
}

export function toOption(item: { id: string; key: string; name: LocalizedText }) {
  return { value: item.id, label: `${nameOf(item)} (${item.key})` };
}

export function nameOf(item: { key: string; name: LocalizedText }) {
  return item.name.ar || item.name.en || item.key;
}

export function sectionTitle(
  section: MealBuilderSection,
  group?: MenuOptionGroup,
  category?: MenuCategory,
  visualKey?: string
) {
  const visual = visualKey ? visualSectionLabel(visualKey).ar : "";
  return (
    section.titleOverride.ar ||
    visual ||
    section.titleOverride.en ||
    group?.name.ar ||
    category?.name.ar ||
    "قسم بدون عنوان"
  );
}

export function selectionLabel(value: string) {
  return SELECTION_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function availableLabel(item: Partial<MenuProduct | MenuOption>) {
  if (
    item.isActive === false ||
    item.isVisible === false ||
    item.isAvailable === false
  ) {
    return "غير متاح";
  }
  return "متاح";
}

export function readinessLabel(readiness: MealBuilderValidation | null) {
  if (!readiness) return "جار التحميل";
  if (readiness.errors.length || readiness.status === "error") return "خطأ";
  if (readiness.warnings.length || readiness.status === "warning") {
    return "تحذير";
  }
  return "جاهز";
}

export function formatDate(value?: string | null) {
  if (!value) return "لا يوجد";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
