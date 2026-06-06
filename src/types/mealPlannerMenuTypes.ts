export interface MealPlannerLocalizedText {
  ar: string;
  en: string;
}

export interface MealPlannerPricing {
  model: string;
  basePriceHalala: number;
  priceHalala: number;
  currency: string;
}

export interface MealPlannerNutrition {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface MealPlannerAction {
  type: string;
  requiresBuilder: boolean;
  canAddDirectly: boolean;
}

export interface MealPlannerOptionSection {
  key: string;
  name: string;
  nameI18n?: MealPlannerLocalizedText;
  optionIds: string[];
  optionKeys: string[];
}

export interface MealPlannerOption {
  id: string;
  optionId: string;
  groupId: string;
  key: string;
  name: string;
  nameI18n?: MealPlannerLocalizedText;
  imageUrl: string;
  nutrition: MealPlannerNutrition;
  extraPriceHalala: number;
  extraWeightUnitGrams: number;
  extraWeightPriceHalala: number;
  sortOrder: number;
  proteinFamilyKey?: string;
  displayCategoryKey?: string;
  isPremium: boolean;
  premiumKey?: string | null;
  ruleTags: string[];
}

export interface MealPlannerOptionGroup {
  id: string;
  groupId: string;
  key: string;
  name: string;
  nameI18n?: MealPlannerLocalizedText;
  minSelections: number;
  maxSelections: number | null;
  isRequired: boolean;
  sortOrder: number;
  ui: Record<string, unknown>;
  optionSections: MealPlannerOptionSection[];
  options: MealPlannerOption[];
}

export interface MealPlannerProduct {
  id: string;
  key: string;
  type: string;
  selectionType: string;
  itemType: string;
  name: string;
  nameI18n?: MealPlannerLocalizedText;
  description: string;
  descriptionI18n?: MealPlannerLocalizedText;
  imageUrl: string;
  pricing: MealPlannerPricing;
  nutrition: MealPlannerNutrition;
  action: MealPlannerAction;
  ui: Record<string, unknown>;
  premiumKey?: string | null;
  extraFeeHalala: number;
  optionGroups: MealPlannerOptionGroup[];
}

export interface MealPlannerSection {
  id: string;
  key: string;
  type: string;
  name: string;
  nameI18n?: MealPlannerLocalizedText;
  ui: Record<string, unknown>;
  products: MealPlannerProduct[];
  optionGroups: MealPlannerOptionGroup[];
}

export interface MealPlannerMenuContract {
  contractVersion: string;
  catalogVersion: string;
  catalogHash: string;
  publishedVersionId: string;
  currency: string;
  sections: MealPlannerSection[];
  rules: Record<string, unknown>;
  legacyIncluded: boolean;
}

export interface MealPlannerMenuResponse {
  status: boolean;
  data: MealPlannerMenuContract;
}
