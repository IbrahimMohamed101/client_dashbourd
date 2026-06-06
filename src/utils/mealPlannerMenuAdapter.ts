import type {
  MealPlannerAction,
  MealPlannerMenuContract,
  MealPlannerNutrition,
  MealPlannerOption,
  MealPlannerOptionGroup,
  MealPlannerOptionSection,
  MealPlannerPricing,
  MealPlannerProduct,
  MealPlannerSection,
} from "@/types/mealPlannerMenuTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SYSTEM_CURRENCY = "SAR";

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const asStringArray = (value: unknown): string[] =>
  asArray(value).map((item) => String(item || "")).filter(Boolean);

const localizedName = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  return asString(record.ar) || asString(record.en) || fallback;
};

function normalizeNutrition(raw: unknown): MealPlannerNutrition {
  const nutrition = asRecord(raw);
  return {
    calories: asNumber(nutrition.calories),
    proteinGrams: asNumber(nutrition.proteinGrams),
    carbGrams: asNumber(nutrition.carbGrams),
    fatGrams: asNumber(nutrition.fatGrams),
  };
}

function normalizePricing(raw: unknown): MealPlannerPricing {
  const pricing = asRecord(raw);
  const priceHalala = asNumber(
    pricing.basePriceHalala ?? pricing.priceHalala ?? pricing.extraFeeHalala
  );
  return {
    model: asString(pricing.model || pricing.pricingModel, "fixed"),
    basePriceHalala: asNumber(pricing.basePriceHalala, priceHalala),
    priceHalala,
    currency: asString(pricing.currency, SYSTEM_CURRENCY),
  };
}

function normalizeAction(raw: unknown): MealPlannerAction {
  const action = asRecord(raw);
  const type = asString(action.type || action.behaviorHint, "open_builder");
  return {
    type,
    requiresBuilder:
      action.requiresBuilder === undefined
        ? type !== "direct_add"
        : Boolean(action.requiresBuilder),
    canAddDirectly: Boolean(action.canAddDirectly || type === "direct_add"),
  };
}

function normalizeOptionSection(raw: unknown): MealPlannerOptionSection {
  const section = asRecord(raw);
  return {
    key: asString(section.key),
    name: localizedName(section.name, asString(section.key)),
    nameI18n: section.nameI18n,
    optionIds: asStringArray(section.optionIds),
    optionKeys: asStringArray(section.optionKeys),
  };
}

function normalizeOption(raw: unknown): MealPlannerOption {
  const option = asRecord(raw);
  const id = asString(option.id || option.optionId || option._id);
  return {
    id,
    optionId: asString(option.optionId || option.id || option._id),
    groupId: asString(option.groupId),
    key: asString(option.key),
    name: localizedName(option.name, asString(option.key)),
    nameI18n: option.nameI18n,
    imageUrl: asString(option.imageUrl),
    nutrition: normalizeNutrition(option.nutrition),
    extraPriceHalala: asNumber(option.extraPriceHalala),
    extraWeightUnitGrams: asNumber(option.extraWeightUnitGrams),
    extraWeightPriceHalala: asNumber(option.extraWeightPriceHalala),
    sortOrder: asNumber(option.sortOrder),
    proteinFamilyKey: option.proteinFamilyKey,
    displayCategoryKey: option.displayCategoryKey,
    isPremium: Boolean(option.isPremium),
    premiumKey: option.premiumKey ?? null,
    ruleTags: asStringArray(option.ruleTags),
  };
}

function normalizeOptionGroup(raw: unknown): MealPlannerOptionGroup {
  const group = asRecord(raw);
  const id = asString(group.id || group.groupId || group._id);
  const maxSelections =
    group.maxSelections === null || group.maxSelections === undefined
      ? null
      : asNumber(group.maxSelections);

  return {
    id,
    groupId: asString(group.groupId || group.id || group._id),
    key: asString(group.key),
    name: localizedName(group.name, asString(group.key)),
    nameI18n: group.nameI18n,
    minSelections: asNumber(group.minSelections),
    maxSelections,
    isRequired: Boolean(group.isRequired),
    sortOrder: asNumber(group.sortOrder),
    ui: asRecord(group.ui),
    optionSections: asArray(group.optionSections).map(normalizeOptionSection),
    options: asArray(group.options).map(normalizeOption),
  };
}

function normalizeProduct(raw: unknown): MealPlannerProduct {
  const product = asRecord(raw);
  const id = asString(product.id || product.productId || product._id);
  const optionGroups = asArray(product.optionGroups).map(normalizeOptionGroup);
  const pricingSource = product.pricing || product;

  return {
    id,
    key: asString(product.key),
    type: asString(product.type, "menu_product"),
    selectionType: asString(product.selectionType),
    itemType: asString(product.itemType, "product"),
    name: localizedName(product.name, asString(product.key)),
    nameI18n: product.nameI18n,
    description: localizedName(product.description),
    descriptionI18n: product.descriptionI18n,
    imageUrl: asString(product.imageUrl),
    pricing: normalizePricing(pricingSource),
    nutrition: normalizeNutrition(product.nutrition),
    action: normalizeAction(product.action || product.ui || product),
    ui: asRecord(product.ui),
    premiumKey: product.premiumKey ?? null,
    extraFeeHalala: asNumber(product.extraFeeHalala),
    optionGroups,
  };
}

function normalizeSection(raw: unknown): MealPlannerSection {
  const section = asRecord(raw);
  return {
    id: asString(section.id || section._id || `section:${section.key || ""}`),
    key: asString(section.key),
    type: asString(section.type, "configurable_product"),
    name: localizedName(section.name, asString(section.key)),
    nameI18n: section.nameI18n,
    ui: asRecord(section.ui),
    products: asArray(section.products).map(normalizeProduct),
    optionGroups: asArray(section.optionGroups).map(normalizeOptionGroup),
  };
}

function sectionsFromLegacyBuilderCatalog(rawData: Record<string, any>) {
  const builderCatalogV2 = asRecord(rawData.builderCatalogV2);
  return asArray(builderCatalogV2.sections).map(normalizeSection);
}

export function mapMealPlannerMenuResponse(
  raw: unknown
): MealPlannerMenuContract {
  const envelope = asRecord(raw);
  const data = asRecord(envelope.data || envelope);
  const sections = data.sections
    ? asArray(data.sections).map(normalizeSection)
    : sectionsFromLegacyBuilderCatalog(data);
  const builderCatalogV2 = asRecord(data.builderCatalogV2);

  return {
    contractVersion: asString(
      data.contractVersion || builderCatalogV2.catalogVersion,
      "meal_planner_menu.frontend_adapter"
    ),
    catalogVersion: asString(
      data.catalogVersion || builderCatalogV2.catalogVersion,
      "meal_planner_menu.frontend_adapter"
    ),
    catalogHash: asString(data.catalogHash),
    publishedVersionId: asString(data.publishedVersionId),
    currency: asString(data.currency || builderCatalogV2.currency, SYSTEM_CURRENCY),
    sections,
    rules: asRecord(data.rules || builderCatalogV2.rules),
    legacyIncluded: Boolean(
      data.builderCatalog ||
        data.builderCatalogV2 ||
        data.regularMeals ||
        data.premiumMeals ||
        data.addons
    ),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
