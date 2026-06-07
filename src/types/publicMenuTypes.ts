export interface PublicMenuLocalizedText {
  ar: string;
  en: string;
}

export interface PublicMenuPricing {
  model: string;
  priceHalala: number;
  currency: string;
  baseUnitGrams: number;
  defaultWeightGrams: number;
  minWeightGrams: number;
  maxWeightGrams: number;
  weightStepGrams: number;
}

export interface PublicMenuAction {
  type: string;
  canAddDirectly: boolean;
  requiresBuilder: boolean;
}

export interface PublicMenuOption {
  id: string;
  optionId: string;
  groupId: string;
  key: string;
  name: string;
  nameI18n?: PublicMenuLocalizedText;
  imageUrl?: string;
  extraPriceHalala: number;
  extraWeightUnitGrams: number;
  extraWeightPriceHalala: number;
  sortOrder: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  proteinFamilyKey?: string;
  displayCategoryKey?: string;
}

export interface PublicMenuOptionGroup {
  id: string;
  groupId: string;
  key: string;
  name: string;
  nameI18n?: PublicMenuLocalizedText;
  minSelections: number;
  maxSelections: number | null;
  isRequired: boolean;
  sortOrder: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  ui: Record<string, unknown>;
  options: PublicMenuOption[];
}

export interface PublicMenuProduct {
  id: string;
  key: string;
  categoryId: string;
  categoryKey: string;
  itemType: string;
  name: string;
  nameI18n?: PublicMenuLocalizedText;
  description: string;
  descriptionI18n?: PublicMenuLocalizedText;
  imageUrl: string;
  sortOrder: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  isCustomizable?: boolean;
  pricing: PublicMenuPricing;
  action: PublicMenuAction;
  ui: Record<string, unknown>;
  optionGroups: PublicMenuOptionGroup[];
}

export interface PublicMenuSection {
  id: string;
  key: string;
  type: string;
  name: string;
  nameI18n?: PublicMenuLocalizedText;
  description: string;
  descriptionI18n?: PublicMenuLocalizedText;
  imageUrl: string;
  sortOrder: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  ui: Record<string, unknown>;
  products: PublicMenuProduct[];
}

export interface PublicMenuContract {
  contractVersion: string;
  source: string;
  fulfillmentMethod: string;
  currency: string;
  vatIncluded: boolean;
  vatPercentage: number;
  sections: PublicMenuSection[];
  productIndex: {
    byId: Record<string, { sectionKey: string; productKey: string }>;
    byKey: Record<string, { sectionKey: string; productId: string }>;
  };
  rules: Record<string, unknown>;
}

export interface PublicMenuResponse {
  status: boolean;
  data: PublicMenuContract;
}
