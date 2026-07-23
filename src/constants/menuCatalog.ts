export const MENU_PRODUCT_CARD_SIZES = ["large", "medium", "small"] as const;

export type MenuProductCardSize = (typeof MENU_PRODUCT_CARD_SIZES)[number];

export const MENU_PRODUCT_CARD_SIZE_OPTIONS: ReadonlyArray<{
  value: MenuProductCardSize;
  label: string;
}> = [
  { value: "large", label: "كبير" },
  { value: "medium", label: "متوسط" },
  { value: "small", label: "صغير" },
];

export const MENU_AVAILABLE_CHANNELS = ["one_time", "subscription"] as const;

export type MenuAvailableChannel = (typeof MENU_AVAILABLE_CHANNELS)[number];

export const DEFAULT_MENU_AVAILABLE_FOR: MenuAvailableChannel[] = [
  "one_time",
  "subscription",
];

export const CANONICAL_SUBSCRIPTION_PLAN_KEYS = [
  "subscription_7_days",
  "subscription_26_days",
  "subscription_30_days",
] as const;

export type CanonicalSubscriptionPlanKey =
  (typeof CANONICAL_SUBSCRIPTION_PLAN_KEYS)[number];

/** Normalize API channel values for dashboard form state. */
export const normalizeAvailableForFromApi = (
  availableFor?: string[]
): MenuAvailableChannel[] => {
  if (!availableFor || !Array.isArray(availableFor) || availableFor.length === 0) {
    return [...DEFAULT_MENU_AVAILABLE_FOR];
  }

  return availableFor
    .map((value) => (value === "order" ? "one_time" : value))
    .filter((value): value is MenuAvailableChannel =>
      (MENU_AVAILABLE_CHANNELS as readonly string[]).includes(value)
    );
};

/** Normalize form channel values before sending to the backend API. */
export const normalizeAvailableForToApi = (
  availableFor?: string[]
): MenuAvailableChannel[] => {
  if (!availableFor || !Array.isArray(availableFor)) return [];

  return availableFor
    .map((value) => (value === "order" ? "one_time" : value))
    .filter((value): value is MenuAvailableChannel =>
      (MENU_AVAILABLE_CHANNELS as readonly string[]).includes(value)
    );
};

export const isCanonicalSubscriptionPlanKey = (
  key?: string | null
): key is CanonicalSubscriptionPlanKey =>
  !!key &&
  (CANONICAL_SUBSCRIPTION_PLAN_KEYS as readonly string[]).includes(key);

type EditableSubscriptionPlanCandidate = {
  key?: string | null;
  daysCount?: unknown;
  durationDays?: unknown;
  gramsOptions?: unknown;
  grams?: unknown;
};

const hasEditablePackagePricing = (plan: EditableSubscriptionPlanCandidate) => {
  const gramsOptions = Array.isArray(plan.gramsOptions)
    ? plan.gramsOptions
    : Array.isArray(plan.grams)
      ? plan.grams
      : [];

  return gramsOptions.some((rawGramsOption) => {
    if (!rawGramsOption || typeof rawGramsOption !== "object") return false;

    const gramsOption = rawGramsOption as {
      grams?: unknown;
      mealsOptions?: unknown;
    };
    const grams = Number(gramsOption.grams);
    if (!Number.isFinite(grams) || grams <= 0) return false;

    const mealsOptions = Array.isArray(gramsOption.mealsOptions)
      ? gramsOption.mealsOptions
      : [];

    return mealsOptions.some((rawMealOption) => {
      if (!rawMealOption || typeof rawMealOption !== "object") return false;

      const mealOption = rawMealOption as {
        mealsPerDay?: unknown;
        priceHalala?: unknown;
        priceSar?: unknown;
        price?: unknown;
      };
      const mealsPerDay = Number(mealOption.mealsPerDay);
      const price = Number(
        mealOption.priceHalala ?? mealOption.priceSar ?? mealOption.price
      );

      return (
        Number.isFinite(mealsPerDay) &&
        mealsPerDay > 0 &&
        Number.isFinite(price) &&
        price > 0
      );
    });
  });
};

export const isEditableSubscriptionPlan = (
  plan?: EditableSubscriptionPlanCandidate | null
): boolean => {
  if (!plan || typeof plan !== "object") return false;
  if (isCanonicalSubscriptionPlanKey(plan.key)) return true;

  const daysCount = Number(plan.daysCount ?? plan.durationDays);
  return Number.isFinite(daysCount) && daysCount > 0 && hasEditablePackagePricing(plan);
};

export const filterCanonicalSubscriptionPlans = <
  T extends EditableSubscriptionPlanCandidate,
>(
  plans: T[]
): T[] => {
  if (!Array.isArray(plans)) return [];
  return plans.filter(isEditableSubscriptionPlan);
};
