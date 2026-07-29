export interface BuilderPremiumMeal {
  id: string;
  configId?: string | null;
  sourceId?: string | null;
  premiumKey: string;
  sourceModel?: string;
  sourceType?: string;
  kind?: string;
  selectionType?: string;
  name: { ar?: string; en?: string } | string;
  imageUrl?: string;
  extraFeeHalala?: number;
  priceHalala?: number;
  currency?: string;
  isActive?: boolean;
  availableForSubscription?: boolean;
  health?: string;
  issueCode?: string | null;
  legacy?: boolean;
}

export interface BuilderPremiumMealsResponse {
  status: boolean;
  data: BuilderPremiumMeal[];
}

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};

export function normalizeBuilderPremiumMealsResponse(
  payload: unknown
): BuilderPremiumMealsResponse {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const rows = Array.isArray(root.data)
    ? root.data
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.premiumMeals)
        ? data.premiumMeals
        : [];

  return {
    status: root.status !== false,
    data: rows.filter(
      (row): row is BuilderPremiumMeal =>
        Boolean(row) && typeof row === "object" && !Array.isArray(row)
    ),
  };
}

export function isSelectablePremiumMeal(meal: BuilderPremiumMeal): boolean {
  return (
    typeof meal.premiumKey === "string" &&
    meal.premiumKey.trim().length > 0 &&
    meal.isActive !== false &&
    meal.availableForSubscription !== false &&
    (!meal.health || meal.health === "ready")
  );
}
