export const MENU_ITEM_TYPES = [
  "basic_salad",
  "basic_meal",
  "fruit_salad",
  "greek_yogurt",
  "green_salad",
  "cold_sandwich",
  "sourdough",
  "dessert",
  "juice",
  "drink",
  "ice_cream",
  "product",
] as const;

export type MenuItemType = (typeof MENU_ITEM_TYPES)[number];

const MENU_ITEM_TYPE_SET = new Set<string>(MENU_ITEM_TYPES);

export const normalizeMenuItemTypeFromApi = (
  itemType?: string | null
): MenuItemType => {
  if (itemType && MENU_ITEM_TYPE_SET.has(itemType)) {
    return itemType as MenuItemType;
  }
  return "product";
};

export const MENU_ITEM_TYPE_OPTIONS: ReadonlyArray<{
  value: MenuItemType;
  label: string;
}> = [
  { value: "basic_salad", label: "سلطة أساسية" },
  { value: "basic_meal", label: "وجبة أساسية" },
  { value: "fruit_salad", label: "سلطة فواكه" },
  { value: "greek_yogurt", label: "زبادي يوناني" },
  { value: "green_salad", label: "سلطة خضراء" },
  { value: "cold_sandwich", label: "ساندويتش بارد" },
  { value: "sourdough", label: "ساوردو" },
  { value: "dessert", label: "حلويات" },
  { value: "juice", label: "عصير" },
  { value: "drink", label: "مشروب" },
  { value: "ice_cream", label: "آيس كريم" },
  { value: "product", label: "منتج" },
];

export const MENU_PRODUCT_CARD_VARIANTS = [
  "standard",
  "premium",
  "large_salad",
  "addon",
] as const;

export const MENU_CATEGORY_CARD_VARIANTS = [
  "meal_builder",
  "light_collection",
  "sandwich_collection",
  "addon_collection",
] as const;

export const MENU_OPTION_GROUP_DISPLAY_STYLES = [
  "chips",
  "radio_cards",
  "checkbox_grid",
  "dropdown",
  "stepper",
] as const;

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

export const filterCanonicalSubscriptionPlans = <T extends { key?: string }>(
  plans: T[]
): T[] => {
  if (!Array.isArray(plans)) return [];
  return plans.filter((plan) => isCanonicalSubscriptionPlanKey(plan.key));
};
