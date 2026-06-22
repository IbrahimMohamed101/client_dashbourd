export type PremiumUpgradeSourceType = "menu_option" | "menu_product";
export type PremiumUpgradeSelectionType =
  | "premium_meal"
  | "premium_large_salad";
export type PremiumUpgradeStatus = "active" | "archived";
export type PremiumUpgradeFilterValue = "all" | string;

export type PremiumUpgradeLocalizedName = {
  ar: string | null;
  en: string | null;
};

export type PremiumUpgradeSourceStatus = {
  exists: boolean;
  active: boolean;
  visible: boolean;
  available: boolean;
  published: boolean;
  subscriptionEnabled: boolean;
  relationValid: boolean;
};

export type PremiumUpgradeConfigDto = {
  id: string;
  revision: number;
  sourceType: PremiumUpgradeSourceType;
  sourceId: string;
  sourceProductId: string | null;
  sourceGroupId: string | null;
  sourceGroupKey: string | null;
  sourceKey: string;
  sourceName: PremiumUpgradeLocalizedName;
  selectionType: PremiumUpgradeSelectionType;
  premiumKey: string;
  displayGroup: { key: string | null; id: string | null };
  upgradeDeltaHalala: number;
  upgradeDeltaSar: number;
  currency: "SAR";
  isEnabled: boolean;
  isVisible: boolean;
  status: PremiumUpgradeStatus;
  sortOrder: number;
  sourceStatus: PremiumUpgradeSourceStatus;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  businessRule: {
    consumesExistingMealSlot: true;
    doesAddMeal: false;
    limitSource: "subscription_total_meals";
  };
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type PremiumUpgradeCandidateDto = {
  id: string;
  sourceId: string;
  type: PremiumUpgradeSourceType;
  sourceType: PremiumUpgradeSourceType;
  sourceProductId: string | null;
  sourceGroupId: string | null;
  sourceProductKey: string | null;
  sourceGroupKey: string | null;
  key: string;
  premiumKey: string;
  name: PremiumUpgradeLocalizedName;
  selectionType: PremiumUpgradeSelectionType;
  upgradeDeltaHalala: number;
  currency: "SAR";
  isLinked: boolean;
  eligibilityDiagnostics: {
    eligible: boolean;
    issues: string[];
  };
};

export type PremiumUpgradeListResponse<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  status: boolean;
};

export type PremiumUpgradeSingleResponse<T> = {
  data: T;
  status: boolean;
};

export type PremiumUpgradeReadinessResponse = {
  isReady: boolean;
  diagnostics: {
    totalConfigs?: number;
    activeConfigs?: number;
    missingSources?: number;
    invalidRelations?: number;
    duplicateKeys?: number;
    priceMismatches?: unknown[];
    legacyChecks?: {
      builderProteinsCount?: number;
      fallbackActive?: boolean;
    };
    configState?: {
      isEmpty?: boolean;
      legacyFallbackActive?: boolean;
      configsAuthoritative?: boolean;
      backfillStatus?: string;
      partialConfigRisk?: boolean;
      knownKeys?: string[];
      configuredKnownKeys?: string[];
      missingConfigKeys?: string[];
    };
    knownSources?: Array<{
      premiumKey?: string;
      resolvable?: boolean;
      sourceType?: string;
      sourceId?: string;
      sourceProductId?: string | null;
      sourceGroupId?: string | null;
      issues?: string[];
    }>;
    unresolvedSourceKeys?: string[];
  };
  status: boolean;
};

export type PremiumUpgradeListFilters = {
  q: string;
  status: PremiumUpgradeFilterValue;
  isEnabled: PremiumUpgradeFilterValue;
  isVisible: PremiumUpgradeFilterValue;
  sourceType: PremiumUpgradeFilterValue;
  selectionType: PremiumUpgradeFilterValue;
  page: number;
  limit: number;
};

export type PremiumUpgradeCandidateFilters = {
  q: string;
  sourceType: PremiumUpgradeFilterValue;
  selectionType: PremiumUpgradeFilterValue;
  includeLinked: boolean;
  page: number;
  limit: number;
};

export type PremiumUpgradeCreatePayload = {
  sourceType: PremiumUpgradeSourceType;
  sourceId: string;
  sourceProductId: string | null;
  sourceGroupId: string | null;
  selectionType: PremiumUpgradeSelectionType;
  displayGroupKey: string;
  upgradeDeltaHalala: number;
  isEnabled: boolean;
  isVisible: boolean;
  sortOrder: number;
};

export type PremiumUpgradeUpdatePayload = {
  expectedRevision: number;
  displayGroupKey?: string;
  upgradeDeltaHalala?: number;
  sortOrder?: number;
};

export type PremiumUpgradeStatePayload = {
  expectedRevision: number;
  isEnabled?: boolean;
  isVisible?: boolean;
};

export type PremiumUpgradeArchivePayload = {
  expectedRevision: number;
  reason: string;
};
