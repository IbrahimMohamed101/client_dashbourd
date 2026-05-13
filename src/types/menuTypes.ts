// ── One-Time Menu Management Types ──
// These types cover the one-time order menu system (§6–§15 of the API README).
// All prices are in halala (100 halala = 1 SAR).

// ── Shared ──

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  status: boolean;
  data: {
    items: T[];
    pagination: PaginationMeta;
  };
}

// ── §6 Menu Categories ──

export interface MenuCategory {
  id: string;
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  isActive: boolean;
  isAvailable: boolean;
  isVisible?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MenuCategoriesResponse = PaginatedResponse<MenuCategory>;

export interface MenuCategoryDetailResponse {
  status: boolean;
  data: MenuCategory;
}

export interface CreateMenuCategoryPayload {
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuCategoryPayload {
  name?: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

// ── §7 Menu Products ──

export type PricingModel = "fixed" | "per_100g";

export type ItemType =
  | "basic_salad"
  | "basic_meal"
  | "fruit_salad"
  | "greek_yogurt"
  | "drink"
  | "sandwich"
  | "dessert"
  | "juice"
  | "ice_cream"
  | string; // allow other item types

export interface MenuProduct {
  id: string;
  categoryId?: string;
  key: string;
  itemType: ItemType;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  pricingModel: PricingModel;
  priceHalala: number;
  baseUnitGrams?: number;
  defaultWeightGrams?: number;
  minWeightGrams?: number;
  maxWeightGrams?: number;
  weightStepGrams?: number;
  isActive: boolean;
  isAvailable: boolean;
  isVisible?: boolean;
  sortOrder: number;
  groups?: MenuProductLinkedGroup[];
  optionGroups?: MenuProductLinkedGroup[];
  createdAt?: string;
  updatedAt?: string;
}

export type MenuProductsResponse = PaginatedResponse<MenuProduct>;

export interface MenuProductDetailResponse {
  status: boolean;
  data: MenuProduct;
}

export interface CreateMenuProductPayload {
  categoryId: string;
  key: string;
  itemType: ItemType;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  pricingModel: PricingModel;
  priceHalala: number;
  baseUnitGrams?: number;
  defaultWeightGrams?: number;
  minWeightGrams?: number;
  maxWeightGrams?: number;
  weightStepGrams?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuProductPayload {
  name?: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  pricingModel?: PricingModel;
  priceHalala?: number;
  baseUnitGrams?: number;
  defaultWeightGrams?: number;
  minWeightGrams?: number;
  maxWeightGrams?: number;
  weightStepGrams?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

// ── §8 Option Groups ──

export interface MenuOptionGroup {
  id: string;
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  isActive: boolean;
  isAvailable: boolean;
  isVisible?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MenuOptionGroupsResponse = PaginatedResponse<MenuOptionGroup>;

export interface MenuOptionGroupDetailResponse {
  status: boolean;
  data: MenuOptionGroup;
}

export interface CreateMenuOptionGroupPayload {
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuOptionGroupPayload {
  name?: LocalizedText;
  description?: LocalizedText;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

// ── §9 Options ──

export interface MenuOption {
  id: string;
  groupId: string;
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  extraPriceHalala: number;
  extraWeightUnitGrams?: number;
  extraWeightPriceHalala?: number;
  isActive: boolean;
  isAvailable: boolean;
  isVisible?: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MenuOptionsResponse = PaginatedResponse<MenuOption>;

export interface MenuOptionDetailResponse {
  status: boolean;
  data: MenuOption;
}

export interface CreateMenuOptionPayload {
  groupId: string;
  key: string;
  name: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  extraPriceHalala?: number;
  extraWeightUnitGrams?: number;
  extraWeightPriceHalala?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface UpdateMenuOptionPayload {
  name?: LocalizedText;
  description?: LocalizedText;
  imageUrl?: string;
  extraPriceHalala?: number;
  extraWeightUnitGrams?: number;
  extraWeightPriceHalala?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

// ── §10 Product Option Group Rules ──

export interface ProductGroupRule {
  groupId: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  sortOrder: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
}

export interface MenuProductLinkedOption extends ProductGroupOptionOverride {
  id?: string;
  option?: MenuOption;
}

export interface MenuProductLinkedGroup extends ProductGroupRule {
  id?: string;
  group?: MenuOptionGroup;
  options?: MenuProductLinkedOption[];
}

export interface LinkGroupsPayload {
  groups: ProductGroupRule[];
}

export interface UpdateSelectionRulesPayload {
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
}

// ── §11 Product Group Option Overrides ──

export interface ProductGroupOptionOverride {
  optionId: string;
  extraPriceHalala?: number;
  extraWeightUnitGrams?: number;
  extraWeightPriceHalala?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
}

export interface LinkOptionsPayload {
  options: ProductGroupOptionOverride[];
}

export interface UpdateOptionOverridePayload {
  extraPriceHalala?: number;
  extraWeightUnitGrams?: number;
  extraWeightPriceHalala?: number;
  isAvailable?: boolean;
  sortOrder?: number;
}

// ── §13 Menu Validation ──

export interface MenuValidationError {
  code: string;
  message: string;
}

export interface MenuValidationSummary {
  categories: number;
  products: number;
  groups: number;
  options: number;
  activeProducts: number;
}

export interface MenuValidationResult {
  status: boolean;
  ok: boolean;
  errors: MenuValidationError[];
  warnings: MenuValidationError[];
  summary?: MenuValidationSummary;
}

export interface MenuValidationResponse {
  status: boolean;
  data: MenuValidationResult;
}

// ── §14 Menu Publish ──

export interface MenuPublishResult {
  versionId: string;
  status: string;
  publishedAt: string;
}

export interface MenuPublishResponse {
  status: boolean;
  data: MenuPublishResult;
}

// ── §15 Menu Audit Logs ──

export interface MenuAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  actorId: string;
  createdAt: string;
}

export type MenuAuditLogsResponse = PaginatedResponse<MenuAuditLog>;

// ── Query Params ──

export interface MenuListParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface MenuProductListParams extends MenuListParams {
  categoryId?: string;
  pricingModel?: PricingModel;
  itemType?: string;
}

export interface MenuOptionListParams extends MenuListParams {
  groupId?: string;
}

export interface MenuAuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
}
