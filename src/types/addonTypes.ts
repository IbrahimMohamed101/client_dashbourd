export interface Addon {
  id?: string;
  _id: string;
  kind?: "item" | "plan" | string;
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  price: number;
  priceHalala: number;
  priceLabel?: string;
  priceSar?: number;
  category: string;
  currency: string;
  type: "subscription" | "one_time";
  billingMode?: "per_day" | "per_meal" | string;
  maxPerDay?: number;
  menuProductIds?: string[];
  menuProductsCount?: number;
  planPricesCount?: number;
  pricingMode?: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  legacyCompatibility?: Record<string, unknown>;
  menuProducts?: unknown[];
  planPrices?: AddonPlanPrice[];
}

export interface AddonsResponse {
  status: boolean;
  data: Addon[];
}

export interface AddonDetailResponse {
  status: boolean;
  data: Addon;
}

export interface CreateAddonPayload {
  kind?: "item" | "plan" | string;
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  priceHalala: number;
  currency: string;
  imageUrl?: string;
  imageFile?: File;
  category: string;
  isActive: boolean;
  sortOrder: number;
  type: "subscription" | "one_time" | string;
  billingMode?: "per_day" | "per_meal" | string;
  maxPerDay?: number;
  menuProductIds?: string[];
}

export interface AddonPlanPrice {
  id?: string;
  _id?: string;
  addonPlanId: string;
  addonPlanName?: {
    ar?: string;
    en?: string;
  };
  category?: string;
  basePlanId: string;
  basePlanName?: {
    ar?: string;
    en?: string;
  };
  daysCount?: number;
  mealsCount?: number;
  priceHalala: number;
  priceSar?: number;
  priceLabel?: string;
  currency?: string;
  isActive: boolean;
}

export interface AddonPlanPricesResponse {
  status: boolean;
  data: AddonPlanPrice[];
}

export interface AddonPlansResponse {
  status: boolean;
  data: Addon[];
}
