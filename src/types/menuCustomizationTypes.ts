import type { LocalizedText } from "@/types/menuTypes";

export interface CustomizationPricing {
  extraPriceHalala?: number | null;
  extraWeightUnitGrams?: number | null;
  extraWeightPriceHalala?: number | null;
  currency?: string;
}

export interface CustomizationNutrition {
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
}

export interface CustomizationLibraryGroup {
  id: string;
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  displayStyle?: string;
  enabled?: boolean;
  sortOrder?: number;
}

export interface CustomizationLibraryOption {
  id: string;
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  suggestedGroupId?: string | null;
  suggestedGroupKey?: string | null;
  defaultPricing?: CustomizationPricing;
  nutrition?: CustomizationNutrition;
  enabled?: boolean;
  sortOrder?: number;
}

export interface ProductCustomizationOption {
  productOptionId?: string | null;
  optionId: string;
  key: string;
  name: LocalizedText;
  imageUrl?: string;
  defaultPricing?: CustomizationPricing;
  overridePricing?: CustomizationPricing;
  effectivePricing?: CustomizationPricing;
  nutrition?: CustomizationNutrition;
  status?: {
    isActive?: boolean;
    isVisible?: boolean;
    isAvailable?: boolean;
  };
  sortOrder?: number;
}

export interface ProductCustomizationGroup {
  productGroupId?: string | null;
  groupId: string;
  key: string;
  name: LocalizedText;
  displayStyle?: string;
  rules: {
    minSelections: number;
    maxSelections: number | null;
    isRequired: boolean;
  };
  status?: {
    isActive?: boolean;
    isVisible?: boolean;
    isAvailable?: boolean;
  };
  sortOrder: number;
  options: ProductCustomizationOption[];
  optionPool?: {
    linkedCount?: number;
    availableCount?: number;
    endpoint?: string;
  };
}

export interface CustomizationLibraryResponse {
  status: boolean;
  data: {
    contractVersion: "dashboard_customization_library.v1" | string;
    groups: CustomizationLibraryGroup[];
    options: CustomizationLibraryOption[];
  };
}

export interface ProductCustomizationResponse {
  status: boolean;
  data: {
    contractVersion: "dashboard_product_composer.v4" | string;
    product: {
      id: string;
      key: string;
      name: LocalizedText;
      categoryId?: string | null;
      isCustomizable: boolean;
      isActive: boolean;
      isVisible: boolean;
      isAvailable: boolean;
    };
    category: {
      id: string;
      key: string;
      name: LocalizedText;
    } | null;
    customization: {
      enabled: boolean;
      summary?: {
        linkedGroupCount?: number;
        linkedOptionCount?: number;
        requiredGroupCount?: number;
      };
      groups: ProductCustomizationGroup[];
    };
    availableActions?: Record<string, boolean>;
    validation?: {
      ok?: boolean;
      errors?: Array<string | { message?: string; code?: string; action?: string }>;
      warnings?: Array<string | { message?: string; code?: string; action?: string }>;
    };
  };
}

export interface SaveProductCustomizationPayload {
  isCustomizable: boolean;
  clearRelations?: boolean;
  allowedOptionIds?: string[];
  currentGroups?: ProductCustomizationGroup[];
  groups: Array<{
    groupId: string;
    rules: {
      minSelections: number;
      maxSelections: number | null;
      isRequired: boolean;
    };
    enabled: boolean;
    sortOrder: number;
    optionIds: string[];
    options?: Array<{
      optionId: string;
      extraPriceHalala?: number | null;
      extraWeightUnitGrams?: number | null;
      extraWeightPriceHalala?: number | null;
      enabled?: boolean;
      sortOrder?: number;
    }>;
  }>;
}
