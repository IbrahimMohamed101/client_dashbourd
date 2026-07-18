import type {
  LocalizedText,
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
  MenuProductComposer,
} from "@/types/menuTypes";
import type { MealPlannerMenuContract } from "@/types/mealPlannerMenuTypes";

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
  key?: string;
  sectionType: MealBuilderSectionType;
  sourceKind?: string;
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
  metadata?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  selectedOptions?: MealBuilderHydratedItem[];
  selectedProducts?: MealBuilderHydratedItem[];
  items?: MealBuilderHydratedItem[];
  hydration?: {
    selectedOptionCount?: number;
    selectedProductCount?: number;
    errorCount?: number;
    warningCount?: number;
  };
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

export interface MealBuilderHydratedItem {
  id: string | null;
  optionId?: string | null;
  productId?: string | null;
  type: "option" | "product" | "missing_option" | "missing_product" | string;
  key?: string;
  name?: LocalizedText;
  label?: string;
  familyKey?: string;
  premiumKey?: string | null;
  itemType?: string;
  categoryId?: string | null;
  categoryKey?: string;
  selectionType?: string;
  configurable?: boolean;
  selected?: boolean;
  required?: boolean;
  eligible?: boolean;
  linked?: boolean;
  available?: boolean;
  active?: boolean;
  visible?: boolean;
  published?: boolean;
  subscriptionEnabled?: boolean;
  relationExists?: boolean;
  catalogItemAvailable?: boolean;
  reasonCodes?: string[];
  warnings?: MealBuilderCheck[];
  errors?: MealBuilderCheck[];
  state?:
    | "eligible"
    | "selected"
    | "assigned_elsewhere"
    | "unavailable"
    | "not_linked"
    | "invalid"
    | string;
  includedVia?: string | null;
  automatic?: boolean;
  action?: {
    requiresBuilder?: boolean;
    treatAsFullMeal?: boolean;
    [key: string]: unknown;
  };
  pricing?: MealBuilderPickerPricing | Record<string, unknown>;
  relation?: Record<string, unknown> | null;
  imageUrl?: string | null;
  kind?: string | null;
  currency?: string | null;
  priceHalala?: number | null;
  premiumPriceHalala?: number | null;
  upgradePriceHalala?: number | null;
  sortOrder?: number | null;
  health?: string | null;
  status?: string | null;
}

export interface MealBuilderBackendErrorDetails {
  message?: string;
  field?: string;
  value?: unknown;
  conflicts?: MealBuilderAssignmentConflict[];
  products?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface MealBuilderAssignmentConflict {
  productId?: string;
  id?: string;
  productName?: string;
  name?: string;
  sectionKey?: string;
  assignedSectionKey?: string;
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
  kind?: "option" | "product" | string;
  label?: string;
  name?: string;
  nameI18n?: LocalizedText;
  imageUrl?: string;
  selectionType?: string;
  isPremium?: boolean;
  premiumKind?: string | null;
  premiumKey?: string | null;
  priceHalala?: number;
  premiumPriceHalala?: number;
  upgradePriceHalala?: number | null;
  currency?: string | null;
  health?: string | null;
  status?: string | null;
  active?: boolean;
  visible?: boolean;
  published?: boolean;
  eligible?: boolean;
  linked?: boolean;
  available?: boolean;
  subscriptionEnabled?: boolean;
  relationExists?: boolean;
  catalogItemAvailable?: boolean;
  requiresPremiumBalance?: boolean;
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
  key?: string;
  sectionType: MealBuilderSectionType;
  sourceKind?: string;
  type?: string;
  source?: unknown;
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
  premiumSection?: MealBuilderPremiumSection | null;
}

export interface MealBuilderPremiumSection {
  automatic?: boolean;
  source?: string;
  title?: string;
  items?: MealBuilderHydratedItem[];
  diagnostics?: MealBuilderCheck[];
  excluded?: MealBuilderHydratedItem[];
  broken?: MealBuilderHydratedItem[];
  [key: string]: unknown;
}

export interface MealBuilderVersionMetadata {
  mode?: "published" | "draft" | string;
  versionId?: string | null;
  draftVersionId?: string | null;
  versionNumber?: number | string | null;
  basedOnPublishedVersionId?: string | null;
  hasDraft?: boolean;
  hasUnpublishedChanges?: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
}

export interface MealBuilderState {
  draft: MealBuilderConfig | null;
  published: MealBuilderConfig | null;
  preview: MealBuilderContract | null;
  contract?: MealBuilderContract | null;
  premiumSection?: MealBuilderPremiumSection | null;
  metadata?: MealBuilderVersionMetadata;
  plannerCatalog?: MealPlannerMenuContract | null;
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

export interface MealBuilderLifecycleResponseData {
  config?: MealBuilderConfig | null;
  draft?: MealBuilderConfig | null;
  published?: MealBuilderConfig | null;
  contract?: MealBuilderContract | null;
  sections?: MealBuilderSection[];
  premiumSection?: MealBuilderPremiumSection | null;
  validation?: MealBuilderValidation | null;
  mode?: "published" | "draft" | string;
  versionId?: string | null;
  draftVersionId?: string | null;
  versionNumber?: number | string | null;
  basedOnPublishedVersionId?: string | null;
  hasDraft?: boolean;
  hasUnpublishedChanges?: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
  reset?: boolean;
  [key: string]: unknown;
}

export interface MealBuilderLifecycleResponse {
  status: boolean;
  data: MealBuilderLifecycleResponseData;
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
    premiumSection?: MealBuilderPremiumSection | null;
    contract: MealBuilderContract;
  };
}

export interface MealBuilderReadinessResponse {
  status: boolean;
  data: MealBuilderValidation;
}

export interface MealBuilderHydratedDraft {
  contractVersion: string;
  draft: MealBuilderConfig | null;
  mode?: "draft" | string;
  versionId?: string | null;
  versionNumber?: number | string | null;
  basedOnPublishedVersionId?: string | null;
  hasUnpublishedChanges?: boolean;
  updatedAt?: string | null;
  premiumSection?: MealBuilderPremiumSection | null;
  ready: boolean;
  errors: MealBuilderCheck[];
  warnings: MealBuilderCheck[];
  sections: MealBuilderSection[];
  validation?: MealBuilderValidation;
}

export interface MealBuilderHydratedDraftResponse {
  status: boolean;
  data: MealBuilderHydratedDraft;
}

export interface MealBuilderPickerParams {
  q?: string;
  search?: string;
  targetSectionKey?: string;
  diagnostics?: boolean | string;
  include?: string;
  unassignedOnly?: boolean;
  includeUnavailable?: boolean;
  includeNotLinked?: boolean;
  page?: number;
  limit?: number;
}

export interface MealBuilderPickerCategory {
  id: string;
  key: string;
  name: LocalizedText;
}

export interface MealBuilderPickerPricing {
  pricingModel?: string;
  model?: string;
  priceHalala?: number;
  basePriceHalala?: number;
  currency?: string;
}

export interface MealBuilderPickerCandidate
  extends Omit<MealBuilderHydratedItem, "id" | "pricing" | "category"> {
  id: string;
  productId?: string;
  key: string;
  name?: LocalizedText;
  label?: string;
  imageUrl?: string | null;
  itemType?: string;
  categoryId?: string | null;
  categoryKey?: string;
  category?: MealBuilderPickerCategory | null;
  selectionType?: string;
  configurable?: boolean;
  pricing?: MealBuilderPickerPricing;
  selected: boolean;
  assigned: boolean;
  assignedSectionKey?: string | null;
  assignable: boolean;
  required: boolean;
  eligible: boolean;
  linked: boolean;
  available: boolean;
  active: boolean;
  visible: boolean;
  published: boolean;
  subscriptionEnabled: boolean;
  relationExists: boolean;
  catalogItemAvailable: boolean;
  reasonCodes: string[];
  warnings: MealBuilderCheck[];
  errors: MealBuilderCheck[];
  state: "eligible" | "selected" | "assigned_elsewhere" | "unavailable" | string;
  sortOrder?: number | null;
}

export interface MealBuilderPickerMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  catalogTotal?: number;
  selectedInCurrentCard?: number;
  assignedToOtherCards?: number;
  unassigned?: number;
  unavailable?: number;
}

export interface MealBuilderPickerResponseData {
  contractVersion: string;
  sectionKey: string;
  targetSectionKey?: string | null;
  candidateType: "option" | "product" | "mixed" | string;
  product?: { id: string; key: string; name: LocalizedText } | null;
  group?: { id: string; key: string; name: LocalizedText } | null;
  category?: MealBuilderPickerCategory | null;
  rules?: Record<string, unknown>;
  candidates: MealBuilderPickerCandidate[];
  meta?: MealBuilderPickerMeta;
}

export interface MealBuilderPickerResponse {
  status: boolean;
  data: MealBuilderPickerResponseData;
}

export interface MealBuilderDraftPayload {
  sections: MealBuilderSection[];
  notes?: string;
}

export interface MealBuilderDirectCardCreatePayload {
  key: string;
  titleOverride: LocalizedText;
  selectedProductIds: string[];
  selectionType?: string;
  sortOrder?: number;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number | null;
  multiSelect?: boolean;
  visible?: boolean;
  metadata?: Record<string, unknown>;
  rules?: Record<string, unknown>;
}

export type MealBuilderDirectCardPatchPayload =
  Partial<Omit<MealBuilderDirectCardCreatePayload, "selectedProductIds">> & {
    selectedProductIds?: string[];
    productIds?: string[];
  };

export interface MealBuilderAddProductsPayload {
  productIds: string[];
}

export interface MealBuilderCardActionSummary {
  sectionCount: number;
  selectedProductCount: number;
  ready: boolean;
  errorCount: number;
  warningCount: number;
}

export interface MealBuilderCardActionData {
  contractVersion: "dashboard_meal_builder_card_action.v1" | string;
  action:
    | "created"
    | "updated"
    | "deleted"
    | "products_added"
    | "product_removed"
    | string;
  sectionKey: string | null;
  previousSectionKey: string | null;
  productId: string | null;
  section: MealBuilderSection | null;
  draft: MealBuilderConfig;
  validation: MealBuilderValidation;
  summary: MealBuilderCardActionSummary;
}

export interface MealBuilderCardActionResponse {
  status: boolean;
  data: MealBuilderCardActionData;
}

export interface MealPlannerPublicV3Envelope {
  status: boolean;
  data: {
    currency?: string;
    builderCatalog?: MealPlannerMenuContract | null;
    addonCatalog?: unknown;
  };
}

export interface MealBuilderCatalogData {
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
  composersByProductId: Map<string, MenuProductComposer>;
}
