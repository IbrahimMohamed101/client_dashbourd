import type {
  MenuCategory,
  MenuOption,
  MenuProduct,
} from "@/types/menuTypes";
import type {
  MealBuilderCheck,
  MealBuilderHydratedItem,
  MealBuilderPremiumSection,
  MealBuilderSection,
  MealBuilderSectionType,
} from "@/types/mealBuilderTypes";
import {
  isFullMealSelectionType,
  isPremiumManagedSection,
  nameOf,
  sectionTreatsAsFullMeal,
} from "./mealBuilderUtils";

export type MealBuilderVisualItem =
  | {
      id: string;
      key: string;
      kind: "option";
      name: string;
      active: boolean;
      selected: boolean;
      eligible: boolean;
      linked: boolean;
      available: boolean;
      published: boolean;
      subscriptionEnabled: boolean;
      relationExists: boolean;
      catalogItemAvailable: boolean;
      state: string;
      reasonCodes: string[];
      warnings: MealBuilderCheck[];
      errors: MealBuilderCheck[];
      sourceSectionIndex: number;
      sourceSectionType: MealBuilderSectionType;
      premiumKey?: string | null;
      imageUrl?: string | null;
      currency?: string | null;
      upgradePriceHalala?: number | null;
      sortOrder?: number | null;
      health?: string | null;
      status?: string | null;
      automatic?: boolean;
    }
  | {
      id: string;
      key: string;
      kind: "product";
      name: string;
      active: boolean;
      selected: boolean;
      eligible: boolean;
      linked: boolean;
      available: boolean;
      published: boolean;
      subscriptionEnabled: boolean;
      relationExists: boolean;
      catalogItemAvailable: boolean;
      state: string;
      reasonCodes: string[];
      warnings: MealBuilderCheck[];
      errors: MealBuilderCheck[];
      sourceSectionIndex: number;
      sourceSectionType: MealBuilderSectionType;
      selectionType: string;
      requiresBuilder: boolean;
      treatAsFullMeal: boolean;
      premiumKey?: string | null;
      imageUrl?: string | null;
      currency?: string | null;
      upgradePriceHalala?: number | null;
      sortOrder?: number | null;
      health?: string | null;
      status?: string | null;
      automatic?: boolean;
    };

export interface MealBuilderVisualCard {
  key: string;
  labelAr: string;
  labelEn: string;
  sortOrder: number;
  sourceKinds: string[];
  rules: string[];
  items: MealBuilderVisualItem[];
  warnings: string[];
  errors: string[];
  backendIssues: MealBuilderCheck[];
}

export function buildMealBuilderVisualCards({
  sections,
  products,
  categories,
  options,
  issues,
  premiumSection,
}: {
  sections: MealBuilderSection[];
  products: MenuProduct[];
  categories: MenuCategory[];
  options: MenuOption[];
  issues: MealBuilderCheck[];
  premiumSection?: MealBuilderPremiumSection | null;
}) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const optionsById = new Map(options.map((option) => [option.id, option]));
  const categoriesById = new Map(
    categories.map((category) => [category.id, category])
  );
  const cards: MealBuilderVisualCard[] = [];
  const usedKeys = new Set<string>();

  sections.forEach((section, index) => {
    if (isPremiumManagedSection(section)) return;

    const key = uniqueSectionKey(section, index, usedKeys);
    const category = section.sourceCategoryId
      ? categoriesById.get(section.sourceCategoryId) ?? null
      : null;
    const card = createSectionCard(section, key, index, category);

    if (Array.isArray(section.items)) {
      hydrateVisualCardFromBackend(card, section, index);
    } else {
      if (section.sectionType === "option_group") {
        for (const optionId of section.selectedOptionIds ?? []) {
          const option = optionsById.get(optionId);
          if (option) addOption(card, option, section, index);
        }
      } else {
        const selectedProducts = productsForSection(
          section,
          products,
          productsById
        );
        for (const product of selectedProducts) {
          const treatsAsFullMeal = sectionTreatsAsFullMeal(section);
          addProduct(card, product, section, index, {
            requiresBuilder: !treatsAsFullMeal,
            treatAsFullMeal: treatsAsFullMeal,
          });
        }
      }
    }

    const sectionIssues = issues.filter(
      (issue) =>
        Number(issue.sectionIndex) === index ||
        (issue.sectionIndex === undefined &&
          issue.sectionType === section.sectionType)
    );
    card.backendIssues.push(...sectionIssues);
    card.errors.push(
      ...sectionIssues
        .filter((issue) => issue.level === "error")
        .map((issue) => issue.message || issue.code)
    );
    card.warnings.push(
      ...sectionIssues
        .filter((issue) => issue.level !== "error")
        .map((issue) => issue.message || issue.code)
    );
    card.items = uniqueItems(card.items);
    card.sourceKinds = [...new Set(card.sourceKinds)];
    cards.push(card);
  });

  const premiumItems = premiumSection?.items ?? [];
  const premiumIssues = [
    ...(premiumSection?.diagnostics ?? []),
    ...(premiumSection?.excluded ?? []),
    ...(premiumSection?.broken ?? []),
  ];
  if (premiumItems.length || premiumIssues.length) {
    cards.push({
      key: "premium",
      labelAr: "الترقيات المميزة",
      labelEn: "Premium Upgrades",
      sortOrder: -1,
      sourceKinds: ["premium_upgrade_configs"],
      rules: ["تُدار من صفحة الترقيات المميزة"],
      items: premiumItems.map((item, index) =>
        premiumItemToVisualItem(item, index)
      ),
      warnings: [],
      errors: [],
      backendIssues: premiumIssues,
    });
  }

  return cards.sort(
    (left, right) =>
      Number(left.sortOrder || 0) - Number(right.sortOrder || 0) ||
      left.key.localeCompare(right.key)
  );
}

function uniqueSectionKey(
  section: MealBuilderSection,
  index: number,
  used: Set<string>
) {
  const base =
    String(section.key || "").trim() ||
    `section_${String(index + 1).padStart(2, "0")}`;
  let key = base;
  let suffix = 2;
  while (used.has(key)) {
    key = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(key);
  return key;
}

function createSectionCard(
  section: MealBuilderSection,
  key: string,
  index: number,
  category: MenuCategory | null
): MealBuilderVisualCard {
  const fallback = humanizeKey(key);
  return {
    key,
    labelAr:
      section.titleOverride?.ar ||
      category?.name?.ar ||
      section.titleOverride?.en ||
      category?.name?.en ||
      fallback,
    labelEn:
      section.titleOverride?.en ||
      category?.name?.en ||
      section.titleOverride?.ar ||
      category?.name?.ar ||
      fallback,
    sortOrder: Number(section.sortOrder ?? index + 1),
    sourceKinds: [section.sourceKind || section.sectionType],
    rules: sectionRuleLabels(section),
    items: [],
    warnings: [],
    errors: [],
    backendIssues: [],
  };
}

function sectionRuleLabels(section: MealBuilderSection) {
  const labels: string[] = [];
  if (section.required) labels.push("إجباري");
  if (section.multiSelect) labels.push("اختيار متعدد");
  if (section.minSelections) labels.push(`الحد الأدنى ${section.minSelections}`);
  if (section.maxSelections !== null && section.maxSelections !== undefined) {
    labels.push(`الحد الأقصى ${section.maxSelections}`);
  }
  if (section.visible === false) labels.push("مخفي");
  return labels;
}

function productsForSection(
  section: MealBuilderSection,
  products: MenuProduct[],
  productsById: Map<string, MenuProduct>
) {
  if (
    section.sectionType === "product_category" &&
    section.includeMode === "all" &&
    section.sourceCategoryId
  ) {
    return products.filter(
      (product) => product.categoryId === section.sourceCategoryId
    );
  }
  return (section.selectedProductIds ?? [])
    .map((productId) => productsById.get(productId))
    .filter(Boolean) as MenuProduct[];
}

function addOption(
  card: MealBuilderVisualCard,
  option: MenuOption,
  section: MealBuilderSection,
  sourceSectionIndex: number
) {
  card.items.push({
    id: option.id,
    key: option.key,
    kind: "option",
    name: nameOf(option),
    active:
      option.isActive !== false &&
      option.isVisible !== false &&
      option.isAvailable !== false,
    selected: true,
    eligible: true,
    linked: true,
    available: option.isAvailable !== false,
    published: Boolean(option.publishedAt ?? true),
    subscriptionEnabled:
      option.availableForSubscription !== false &&
      (!Array.isArray(option.availableFor) ||
        option.availableFor.length === 0 ||
        option.availableFor.includes("subscription")),
    relationExists: true,
    catalogItemAvailable: true,
    state: "selected",
    reasonCodes: ["SELECTED"],
    warnings: [],
    errors: [],
    sourceSectionIndex,
    sourceSectionType: section.sectionType,
  });
}

function addProduct(
  card: MealBuilderVisualCard,
  product: MenuProduct,
  section: MealBuilderSection,
  sourceSectionIndex: number,
  meta: { requiresBuilder: boolean; treatAsFullMeal: boolean }
) {
  card.items.push({
    id: product.id,
    key: product.key,
    kind: "product",
    name: nameOf(product),
    active:
      product.isActive !== false &&
      product.isVisible !== false &&
      product.isAvailable !== false,
    selected: true,
    eligible: true,
    linked: true,
    available: product.isAvailable !== false,
    published: Boolean(product.publishedAt ?? true),
    subscriptionEnabled:
      !Array.isArray(product.availableFor) ||
      product.availableFor.length === 0 ||
      product.availableFor.includes("subscription"),
    relationExists: true,
    catalogItemAvailable: true,
    state: "selected",
    reasonCodes: ["SELECTED"],
    warnings: [],
    errors: [],
    sourceSectionIndex,
    sourceSectionType: section.sectionType,
    selectionType: section.selectionType,
    requiresBuilder: meta.requiresBuilder,
    treatAsFullMeal: meta.treatAsFullMeal,
  });
}

function hydrateVisualCardFromBackend(
  card: MealBuilderVisualCard,
  section: MealBuilderSection,
  sourceSectionIndex: number
) {
  for (const item of section.items ?? []) {
    const kind = item.type?.includes("product") ? "product" : "option";
    const base = {
      id:
        item.id ||
        item.optionId ||
        item.productId ||
        `${card.key}:${item.key}`,
      key: item.key || "",
      name: hydratedName(item),
      active: item.active !== false && item.visible !== false,
      selected: item.selected === true,
      eligible: item.eligible === true,
      linked: item.linked === true,
      available: item.available === true,
      published: item.published === true,
      subscriptionEnabled: item.subscriptionEnabled === true,
      relationExists: item.relationExists === true,
      catalogItemAvailable: item.catalogItemAvailable === true,
      state: item.state || "invalid",
      reasonCodes: item.reasonCodes ?? [],
      warnings: item.warnings ?? [],
      errors: item.errors ?? [],
      sourceSectionIndex,
      sourceSectionType: section.sectionType,
      premiumKey: item.premiumKey ?? null,
      imageUrl: item.imageUrl ?? null,
      currency: item.currency ?? null,
      upgradePriceHalala:
        item.upgradePriceHalala ??
        item.premiumPriceHalala ??
        item.priceHalala ??
        null,
      sortOrder: item.sortOrder ?? null,
      health: item.health ?? null,
      status: item.status ?? null,
      automatic: item.automatic === true,
    };

    if (kind === "product") {
      card.items.push({
        ...base,
        kind: "product",
        selectionType: item.selectionType || section.selectionType,
        requiresBuilder: hydratedRequiresBuilder(item, section),
        treatAsFullMeal: hydratedTreatsAsFullMeal(item, section),
      });
    } else {
      card.items.push({ ...base, kind: "option" });
    }
  }

  card.backendIssues.push(
    ...(section.items ?? []).flatMap((item) => [
      ...(item.errors ?? []),
      ...(item.warnings ?? []),
    ])
  );
}

function hydratedRequiresBuilder(
  item: MealBuilderHydratedItem,
  section: MealBuilderSection
) {
  const action = (
    item as MealBuilderHydratedItem & {
      action?: { requiresBuilder?: boolean };
      requiresBuilder?: boolean;
    }
  ).action;
  if (typeof action?.requiresBuilder === "boolean") return action.requiresBuilder;
  if (typeof (item as { requiresBuilder?: boolean }).requiresBuilder === "boolean") {
    return Boolean((item as { requiresBuilder?: boolean }).requiresBuilder);
  }
  return item.configurable === true && !hydratedTreatsAsFullMeal(item, section);
}

function hydratedTreatsAsFullMeal(
  item: MealBuilderHydratedItem,
  section: MealBuilderSection
) {
  const action = (
    item as MealBuilderHydratedItem & {
      action?: { treatAsFullMeal?: boolean };
      treatAsFullMeal?: boolean;
    }
  ).action;
  if (typeof action?.treatAsFullMeal === "boolean") return action.treatAsFullMeal;
  if (typeof (item as { treatAsFullMeal?: boolean }).treatAsFullMeal === "boolean") {
    return Boolean((item as { treatAsFullMeal?: boolean }).treatAsFullMeal);
  }
  return sectionTreatsAsFullMeal(section) || isFullMealSelectionType(item.selectionType);
}

function hydratedName(item: MealBuilderHydratedItem) {
  return item.label || item.name?.ar || item.name?.en || item.key || "عنصر غير معروف";
}

function premiumItemToVisualItem(
  item: MealBuilderHydratedItem,
  index: number
): MealBuilderVisualItem {
  const kind =
    item.type?.includes("product") || item.kind === "product"
      ? "product"
      : "option";
  const base = {
    id: item.id || item.optionId || item.productId || item.key || `premium-${index}`,
    key: item.key || item.premiumKey || `premium-${index}`,
    name: hydratedName(item),
    active: item.active !== false && item.visible !== false,
    selected: true,
    eligible: item.eligible !== false,
    linked: item.linked !== false,
    available: item.available !== false,
    published: item.published !== false,
    subscriptionEnabled: item.subscriptionEnabled !== false,
    relationExists: item.relationExists !== false,
    catalogItemAvailable: item.catalogItemAvailable !== false,
    state: item.state || "selected",
    reasonCodes: item.reasonCodes ?? [],
    warnings: item.warnings ?? [],
    errors: item.errors ?? [],
    sourceSectionIndex: -1,
    sourceSectionType: "product_list" as MealBuilderSectionType,
    premiumKey: item.premiumKey ?? item.key ?? null,
    imageUrl: item.imageUrl ?? null,
    currency: item.currency ?? null,
    upgradePriceHalala:
      item.upgradePriceHalala ??
      item.premiumPriceHalala ??
      item.priceHalala ??
      null,
    sortOrder: item.sortOrder ?? index + 1,
    health: item.health ?? null,
    status: item.status ?? null,
    automatic: true,
  };

  return kind === "product"
    ? {
        ...base,
        kind: "product",
        selectionType: item.selectionType || "premium_meal",
        requiresBuilder: false,
        treatAsFullMeal: true,
      }
    : { ...base, kind: "option" };
}

export function optionFamily(
  option: MenuOption,
  section?: Pick<MealBuilderSection, "key" | "selectionType" | "metadata">
) {
  return (
    String(section?.key || "").trim() ||
    String(section?.metadata?.proteinFamilyKey || "").trim() ||
    String(option.proteinFamilyKey || "").trim() ||
    String(option.displayCategoryKey || "").trim() ||
    "options"
  );
}

export function optionMatchesVisualCard(option: MenuOption, cardKey: string) {
  const values = [
    option.key,
    option.proteinFamilyKey,
    option.displayCategoryKey,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return values.includes(cardKey);
}

export function productMatchesVisualCard(
  product: MenuProduct,
  cardKey: string,
  categories: MenuCategory[]
) {
  const category = categories.find((item) => item.id === product.categoryId);
  return [product.key, product.itemType, category?.key]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .includes(cardKey);
}

function uniqueItems(items: MealBuilderVisualItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function humanizeKey(value: string) {
  return value.replace(/[_-]+/g, " ").trim() || "قسم";
}
