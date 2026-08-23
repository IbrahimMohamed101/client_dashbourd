export interface CatalogNutrition {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface CatalogItem {
  id: string;
  key: string;
  nameI18n: { ar: string; en: string };
  itemKind: string;
  nutrition: CatalogNutrition;
  isActive: boolean;
  isAvailable: boolean;
  linkedProductsCount: number;
  linkedOptionsCount: number;
  usageCount: number;
}

export interface CatalogItemsResponse {
  status: boolean;
  data: CatalogItem[];
}
