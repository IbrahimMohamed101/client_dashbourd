import type {
  PublicMenuAction,
  PublicMenuContract,
  PublicMenuOption,
  PublicMenuOptionGroup,
  PublicMenuPricing,
  PublicMenuProduct,
  PublicMenuSection,
} from "@/types/publicMenuTypes";

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

const localizedName = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  return asString(record.ar) || asString(record.en) || fallback;
};

function normalizePricing(raw: unknown): PublicMenuPricing {
  const pricing = asRecord(raw);
  return {
    model: asString(pricing.model || pricing.pricingModel, "fixed"),
    priceHalala: asNumber(pricing.priceHalala),
    currency: asString(pricing.currency, SYSTEM_CURRENCY),
    baseUnitGrams: asNumber(pricing.baseUnitGrams),
    defaultWeightGrams: asNumber(pricing.defaultWeightGrams),
    minWeightGrams: asNumber(pricing.minWeightGrams),
    maxWeightGrams: asNumber(pricing.maxWeightGrams),
    weightStepGrams: asNumber(pricing.weightStepGrams),
  };
}

function normalizeAction(raw: unknown): PublicMenuAction {
  const action = asRecord(raw);
  const type = asString(action.type || action.behaviorHint, "open_builder");
  return {
    type,
    canAddDirectly: Boolean(action.canAddDirectly || type === "direct_add"),
    requiresBuilder: action.requiresBuilder === undefined
      ? type !== "direct_add"
      : Boolean(action.requiresBuilder),
  };
}

function normalizeOption(raw: unknown): PublicMenuOption {
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
    extraPriceHalala: asNumber(option.extraPriceHalala),
    extraWeightUnitGrams: asNumber(option.extraWeightUnitGrams),
    extraWeightPriceHalala: asNumber(option.extraWeightPriceHalala),
    sortOrder: asNumber(option.sortOrder),
    proteinFamilyKey: option.proteinFamilyKey,
    displayCategoryKey: option.displayCategoryKey,
  };
}

function normalizeOptionGroup(raw: unknown): PublicMenuOptionGroup {
  const group = asRecord(raw);
  const id = asString(group.id || group.groupId || group._id);
  const maxSelections = group.maxSelections === null || group.maxSelections === undefined
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
    options: asArray(group.options).map(normalizeOption),
  };
}

function normalizeProduct(raw: unknown, section: Record<string, any>): PublicMenuProduct {
  const product = asRecord(raw);
  const pricingSource = product.pricing || product;
  const actionSource = product.action || product.ui || product;
  return {
    id: asString(product.id || product._id),
    key: asString(product.key),
    categoryId: asString(product.categoryId || section.id),
    categoryKey: asString(product.categoryKey || section.key),
    itemType: asString(product.itemType, "product"),
    name: localizedName(product.name, asString(product.key)),
    nameI18n: product.nameI18n,
    description: localizedName(product.description),
    descriptionI18n: product.descriptionI18n,
    imageUrl: asString(product.imageUrl),
    sortOrder: asNumber(product.sortOrder),
    pricing: normalizePricing(pricingSource),
    action: normalizeAction(actionSource),
    ui: asRecord(product.ui),
    optionGroups: asArray(product.optionGroups).map(normalizeOptionGroup),
  };
}

function normalizeSection(raw: unknown): PublicMenuSection {
  const section = asRecord(raw);
  return {
    id: asString(section.id || section._id),
    key: asString(section.key),
    type: asString(section.type, "product_collection"),
    name: localizedName(section.name, asString(section.key)),
    nameI18n: section.nameI18n,
    description: localizedName(section.description),
    descriptionI18n: section.descriptionI18n,
    imageUrl: asString(section.imageUrl),
    sortOrder: asNumber(section.sortOrder),
    ui: asRecord(section.ui),
    products: asArray(section.products).map((product) =>
      normalizeProduct(product, section)
    ),
  };
}

function buildProductIndex(sections: PublicMenuSection[]) {
  const products = sections.flatMap((section) => section.products);
  return {
    byId: Object.fromEntries(products.map((product) => [
      product.id,
      { sectionKey: product.categoryKey, productKey: product.key },
    ])),
    byKey: Object.fromEntries(products.map((product) => [
      product.key,
      { sectionKey: product.categoryKey, productId: product.id },
    ])),
  };
}

function fallbackFromLegacyMenu(rawData: Record<string, any>): PublicMenuContract {
  const sections = asArray(rawData.categories).map(normalizeSection);
  return {
    contractVersion: "one_time_menu.v2.frontend_fallback",
    source: asString(rawData.source, "one_time_order"),
    fulfillmentMethod: asString(rawData.fulfillmentMethod, "pickup"),
    currency: asString(rawData.currency, SYSTEM_CURRENCY),
    vatIncluded: rawData.vatIncluded !== false,
    vatPercentage: asNumber(rawData.vatPercentage),
    sections,
    productIndex: buildProductIndex(sections),
    rules: {
      adapterFallback: true,
      pricingUnit: "halala",
    },
  };
}

export function mapPublicMenuResponse(raw: unknown): PublicMenuContract {
  const envelope = asRecord(raw);
  const data = asRecord(envelope.data || envelope);
  const contract = asRecord(data.publicMenuV2);

  if (!contract.contractVersion) {
    return fallbackFromLegacyMenu(data);
  }

  const sections = asArray(contract.sections).map(normalizeSection);
  return {
    contractVersion: asString(contract.contractVersion, "one_time_menu.v2"),
    source: asString(contract.source, "one_time_order"),
    fulfillmentMethod: asString(contract.fulfillmentMethod, "pickup"),
    currency: asString(contract.currency, SYSTEM_CURRENCY),
    vatIncluded: contract.vatIncluded !== false,
    vatPercentage: asNumber(contract.vatPercentage),
    sections,
    productIndex: contract.productIndex || buildProductIndex(sections),
    rules: asRecord(contract.rules),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
