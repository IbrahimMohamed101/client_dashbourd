import type {
  LocalizedText,
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
  MenuProductComposer,
} from "@/types/menuTypes";

export type MealBuilderSectionType =
  | "option_group"
  | "product_category"
  | "product_list";

export type MealBuilderSelectionType =
  | "standard_meal"
  | "premium_meal"
  | "premium_large_salad"
  | "sandwich"
  | string;

export interface MealBuilderSection {
  id?: string;
  sectionType: MealBuilderSectionType;
  productContextId?: string | null;
  sourceGroupId?: string | null;
  sourceCategoryId?: string | null;
  selectedOptionIds: string[];
  selectedProductIds: string[];
  includeMode: "all" | "selected";
  selectionType: MealBuilderSelectionType;
  titleOverride: LocalizedText;
  sortOrder: number;
  required: boolean;
  minSelections: number;
  maxSelections: number | null;
  multiSelect: boolean;
  visible: boolean;
  availableFor: string[];
}

export interface MealBuilderConfig {
  id: string;
  status: "draft" | "published" | "archived" | string;
  isCurrent: boolean;
  contractVersion: string;
  revisionHash: string;
  source: string;
  createdBySystem: boolean;
  bootstrapKey: string;
  publishedAt: string | null;
  publishedBy?: string | null;
  notes?: string;
  sections: MealBuilderSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MealBuilderCheck {
  level?: "error" | "warning" | string;
  code?: string;
  message?: string;
  sectionIndex?: number;
  sectionType?: string;
  productId?: string | null;
  groupId?: string | null;
  optionId?: string | null;
  [key: string]: unknown;
}

export interface MealBuilderValidation {
  status: "ok" | "warning" | "error" | string;
  ready: boolean;
  errors: MealBuilderCheck[];
  warnings: MealBuilderCheck[];
  checks: MealBuilderCheck[];
  summary?: Record<string, unknown>;
}

export interface MealBuilderContractItem {
  id: string;
  key?: string;
  type?: "option" | "product" | string;
  name?: string;
  nameI18n?: LocalizedText;
  imageUrl?: string;
  selectionType?: string;
  isPremium?: boolean;
  premiumKind?: string | null;
  premiumKey?: string | null;
  priceHalala?: number;
  premiumPriceHalala?: number;
  requiresPremiumBalance?: boolean;
  available?: boolean;
  sortOrder?: number;
  optionGroups?: Array<{
    id: string;
    key?: string;
    name?: string;
    items?: MealBuilderContractItem[];
    options?: MealBuilderContractItem[];
  }>;
}

export interface MealBuilderContractSection {
  id: string;
  sectionType: MealBuilderSectionType;
  title?: string;
  titleI18n?: LocalizedText;
  sortOrder: number;
  required: boolean;
  minSelections: number;
  maxSelections: number | null;
  multiSelect: boolean;
  selectionType: string;
  productContextId?: string;
  productKey?: string;
  sourceGroupId?: string;
  groupKey?: string;
  sourceCategoryId?: string | null;
  includeMode?: "all" | "selected";
  items: MealBuilderContractItem[];
}

export interface MealBuilderContract {
  contractVersion: string;
  revisionHash: string;
  publishedAt: string | null;
  sections: MealBuilderContractSection[];
}

export interface MealBuilderState {
  draft: MealBuilderConfig | null;
  published: MealBuilderConfig | null;
  preview: MealBuilderContract | null;
  validation: {
    draft: MealBuilderValidation | null;
    published: MealBuilderValidation | null;
  };
}

export interface MealBuilderStateResponse {
  status: boolean;
  data: MealBuilderState;
}

export interface MealBuilderConfigResponse {
  status: boolean;
  data: MealBuilderConfig;
}

export interface MealBuilderValidationResponse {
  status: boolean;
  data: MealBuilderValidation;
}

export interface MealBuilderPublishResponse {
  status: boolean;
  data: {
    config: MealBuilderConfig;
    validation: MealBuilderValidation;
    contract: MealBuilderContract;
  };
}

export interface MealBuilderReadinessResponse {
  status: boolean;
  data: MealBuilderValidation;
}

export interface MealBuilderDraftPayload {
  sections: MealBuilderSection[];
  notes?: string;
}

export interface MealBuilderCatalogData {
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
  composersByProductId: Map<string, MenuProductComposer>;
}
