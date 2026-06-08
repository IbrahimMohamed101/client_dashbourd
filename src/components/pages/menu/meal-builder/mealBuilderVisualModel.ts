import type {
  MenuCategory,
  MenuOption,
  MenuProduct,
} from "@/types/menuTypes";
import type {
  MealBuilderCheck,
  MealBuilderHydratedItem,
  MealBuilderSection,
  MealBuilderSectionType,
} from "@/types/mealBuilderTypes";
import {
  PREMIUM_REQUIRED_KEYS,
  REQUIRED_SECTION_ORDER,
  SECTION_RULE_BADGES,
  VISUAL_SECTION_LABELS,
} from "./mealBuilderConstants";
import { nameOf } from "./mealBuilderUtils";

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

const CHICKEN_KEYS = [
  "chicken",
  "chicken_fajita",
  "spicy_chicken",
  "italian_spiced_chicken",
  "chicken_tikka",
  "asian_chicken",
  "chicken_strips",
  "grilled_chicken",
  "mexican_chicken",
];

const BEEF_KEYS = ["beef", "meatballs", "beef_stroganoff"];
const FISH_KEYS = ["fish", "tuna", "fish_fillet"];
const EGG_KEYS = ["eggs", "boiled_eggs"];
const CARB_KEYS = [
  "white_rice",
  "turmeric_rice",
  "alfredo_pasta",
  "red_sauce_pasta",
  "roasted_potato",
  "sweet_potato",
  "grilled_mixed_vegetables",
];

const CHICKEN_MATCHERS = ["chicken", "دجاج"];
const BEEF_MATCHERS = ["beef", "meat", "stroganoff", "steak", "لحم"];
const FISH_MATCHERS = ["fish", "tuna", "salmon", "shrimp", "سمك", "تونا"];
const EGG_MATCHERS = ["egg", "بيض"];
const CARB_MATCHERS = ["rice", "pasta", "potato", "carb", "نشو", "رز", "بطاط"];

export function buildMealBuilderVisualCards({
  sections,
  products,
  categories,
  options,
  issues,
}: {
  sections: MealBuilderSection[];
  products: MenuProduct[];
  categories: MenuCategory[];
  options: MenuOption[];
  issues: MealBuilderCheck[];
}) {
  const cards = createEmptyCards();
  const optionsById = new Map(options.map((option) => [option.id, option]));
  const productsById = new Map(products.map((product) => [product.id, product]));

  sections.forEach((section, index) => {
    if (section.key && REQUIRED_SECTION_ORDER.includes(section.key) && Array.isArray(section.items)) {
      hydrateVisualCardFromBackend(cards[section.key], section, index);
      return;
    }

    const sectionIssues = issues.filter(
      (issue) => Number(issue.sectionIndex) === index || issue.sectionType === section.sectionType
    );
    const selectedOptions = section.selectedOptionIds
      .map((id) => optionsById.get(id))
      .filter(Boolean) as MenuOption[];
    const selectedProducts = section.selectedProductIds
      .map((id) => productsById.get(id))
      .filter(Boolean) as MenuProduct[];

    if (section.sectionType === "option_group") {
      selectedOptions.forEach((option) => {
        const family = optionFamily(option, section);
        addOption(cards[family], option, section, index);
      });
    }

    if (section.sectionType === "product_category") {
      const category = categories.find((item) => item.id === section.sourceCategoryId);
      const productsInCategory =
        section.includeMode === "all"
          ? products.filter((product) => product.categoryId === section.sourceCategoryId)
          : selectedProducts;
      const isSandwich =
        section.selectionType === "sandwich" ||
        category?.key === "cold_sandwiches" ||
        productsInCategory.some((product) => product.key.includes("sandwich"));
      productsInCategory.forEach((product) => {
        addProduct(cards[isSandwich ? "sandwich" : "premium"], product, section, index, {
          requiresBuilder: false,
          treatAsFullMeal: isSandwich,
        });
      });
    }

    if (section.sectionType === "product_list") {
      selectedProducts.forEach((product) => {
        const target = product.key === "premium_large_salad" ||
          section.selectionType === "premium_large_salad"
          ? "premium"
          : "sandwich";
        addProduct(cards[target], product, section, index, {
          requiresBuilder: section.selectionType === "premium_large_salad",
          treatAsFullMeal: target === "sandwich",
        });
      });
    }

    sectionIssues.forEach((issue) => {
      const target = sectionTarget(section, selectedOptions, selectedProducts);
      cards[target].backendIssues.push(issue);
    });
  });

  const premiumKeys = new Set(cards.premium.items.map((item) => item.key));
  PREMIUM_REQUIRED_KEYS.forEach((key) => {
    if (!premiumKeys.has(key)) {
      cards.premium.errors.push(`خيار بريميوم مطلوب غير موجود: ${key}`);
    }
  });
  if (!premiumKeys.has("premium_large_salad")) {
    cards.premium.errors.push("السلطة الكبيرة البريميوم غير موجودة داخل قسم مميز.");
  }

  if (!cards.carbs.items.length) {
    cards.carbs.warnings.push("قسم النشويات لا يحتوي خيارات ظاهرة حاليا.");
  }

  return REQUIRED_SECTION_ORDER.map((key, index) => ({
    ...cards[key],
    sortOrder: index + 1,
    sourceKinds: [...new Set(cards[key].sourceKinds)],
    items: uniqueItems(cards[key].items),
  }));
}

function createEmptyCards(): Record<string, MealBuilderVisualCard> {
  return Object.fromEntries(
    REQUIRED_SECTION_ORDER.map((key, index) => {
      const label = VISUAL_SECTION_LABELS[key];
      return [
        key,
        {
          key,
          labelAr: label.ar,
          labelEn: label.en,
          sortOrder: index + 1,
          sourceKinds: [],
          rules: SECTION_RULE_BADGES[key] ?? [],
          items: [],
          warnings: [],
          errors: [],
          backendIssues: [],
        },
      ];
    })
  ) as Record<string, MealBuilderVisualCard>;
}

function addOption(
  card: MealBuilderVisualCard,
  option: MenuOption,
  section: MealBuilderSection,
  sourceSectionIndex: number
) {
  card.sourceKinds.push(section.sectionType);
  card.items.push({
    id: option.id,
    key: option.key,
    kind: "option",
    name: nameOf(option),
    active: option.isActive !== false && option.isVisible !== false && option.isAvailable !== false,
    selected: true,
    eligible: true,
    linked: true,
    available: option.isAvailable !== false,
    published: true,
    subscriptionEnabled: option.availableForSubscription !== false,
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
  card.sourceKinds.push(section.sectionType);
  card.items.push({
    id: product.id,
    key: product.key,
    kind: "product",
    name: nameOf(product),
    active: product.isActive !== false && product.isVisible !== false && product.isAvailable !== false,
    selected: true,
    eligible: true,
    linked: true,
    available: product.isAvailable !== false,
    published: true,
    subscriptionEnabled: product.availableFor?.includes("subscription") !== false,
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
  card.sourceKinds.push(section.sourceKind || section.sectionType);
  (section.items ?? []).forEach((item) => {
    const kind = item.type?.includes("product") ? "product" : "option";
    const base = {
      id: item.id || item.optionId || item.productId || `${section.key}:${item.key}`,
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
    };

    if (kind === "product") {
      card.items.push({
        ...base,
        kind: "product",
        selectionType: item.selectionType || section.selectionType,
        requiresBuilder: item.configurable === true && section.key !== "sandwich",
        treatAsFullMeal: section.key === "sandwich" || item.selectionType === "sandwich",
      });
      return;
    }

    card.items.push({
      ...base,
      kind: "option",
    });
  });
  card.backendIssues.push(...(section.items ?? []).flatMap((item) => [
    ...(item.errors ?? []),
    ...(item.warnings ?? []),
  ]));
}

function hydratedName(item: MealBuilderHydratedItem) {
  return item.label || item.name?.ar || item.name?.en || item.key || "عنصر غير معروف";
}

export function optionFamily(option: MenuOption, section?: Pick<MealBuilderSection, "selectionType">) {
  if (section?.selectionType === "premium_meal" || option.premiumKey) return "premium";
  if (matchesOption(option, CARB_KEYS, CARB_MATCHERS)) return "carbs";
  if (matchesOption(option, BEEF_KEYS, BEEF_MATCHERS)) return "beef";
  if (matchesOption(option, FISH_KEYS, FISH_MATCHERS)) return "fish";
  if (matchesOption(option, EGG_KEYS, EGG_MATCHERS)) return "eggs";
  if (matchesOption(option, CHICKEN_KEYS, CHICKEN_MATCHERS)) return "chicken";
  return "chicken";
}

export function optionMatchesVisualCard(option: MenuOption, cardKey: string) {
  if (cardKey === "premium") {
    return Boolean(option.premiumKey) ||
      Number(option.extraFeeHalala ?? option.extraPriceHalala ?? 0) > 0 ||
      PREMIUM_REQUIRED_KEYS.includes(option.key);
  }
  return optionFamily(option, { selectionType: "standard_meal" }) === cardKey;
}

export function productMatchesVisualCard(
  product: MenuProduct,
  cardKey: string,
  categories: MenuCategory[]
) {
  const category = categories.find((item) => item.id === product.categoryId);
  if (cardKey === "premium") {
    return product.key === "premium_large_salad" || product.itemType === "premium_large_salad";
  }
  if (cardKey === "sandwich") {
    return (
      product.itemType?.includes("sandwich") ||
      product.key.includes("sandwich") ||
      category?.key === "cold_sandwiches"
    );
  }
  return false;
}

function matchesOption(option: MenuOption, keys: string[], matchers: string[]) {
  const key = option.key.toLowerCase();
  if (keys.includes(key)) return true;
  const text = `${option.key} ${option.proteinFamilyKey ?? ""} ${option.displayCategoryKey ?? ""} ${option.name.ar} ${option.name.en}`.toLowerCase();
  return matchers.some((matcher) => text.includes(matcher));
}

function sectionTarget(
  section: MealBuilderSection,
  selectedOptions: MenuOption[],
  selectedProducts: MenuProduct[]
) {
  if (section.selectionType === "premium_meal" || section.selectionType === "premium_large_salad") return "premium";
  if (section.selectionType === "sandwich") return "sandwich";
  if (selectedProducts.some((product) => product.key === "premium_large_salad")) return "premium";
  if (selectedOptions.some((option) => optionFamily(option, section) === "carbs")) return "carbs";
  return "chicken";
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
