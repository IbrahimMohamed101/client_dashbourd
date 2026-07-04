import type { MealBuilderSectionType } from "@/types/mealBuilderTypes";

export const SECTION_LABELS: Record<MealBuilderSectionType, string> = {
  option_group: "مجموعة خيارات",
  product_category: "تصنيف منتجات",
  product_list: "قائمة منتجات",
};

export const SELECTION_TYPES = [
  { value: "standard_meal", label: "وجبة عادية" },
  { value: "premium_meal", label: "ترقية بروتين بريميوم" },
  { value: "premium_large_salad", label: "سلطة كبيرة بريميوم" },
  { value: "sandwich", label: "ساندويتش" },
];

export const FULL_MEAL_PRODUCT_SELECTION_TYPES = [
  "sandwich",
  "full_meal_product",
  "meal_replacement",
  "standalone_meal",
];

export const ERROR_COPY: Record<string, string> = {
  PLANNER_BUILDER_PRODUCT_NOT_INCLUDED:
    "المنتج غير موجود في منشئ الوجبات المنشور.",
  PLANNER_BUILDER_GROUP_NOT_INCLUDED:
    "مجموعة الخيارات غير موجودة لهذا المنتج في المنشئ المنشور.",
  PLANNER_BUILDER_OPTION_NOT_INCLUDED:
    "الخيار غير موجود داخل هذه المجموعة في المنشئ المنشور.",
  PLANNER_BUILDER_CONFIG_UNAVAILABLE: "إعداد منشئ الوجبات غير متاح.",
  MEAL_BUILDER_NOT_PUBLISHED: "لا يوجد منشئ وجبات منشور حتى الآن.",
  MEAL_BUILDER_PREMIUM_PROTEIN_PRICE_MISSING:
    "يوجد بروتين بريميوم بدون سعر ترقية.",
  MEAL_BUILDER_PREMIUM_PROTEINS_MISSING:
    "قسم البروتينات البريميوم لا يحتوي خيارات صالحة.",
  MEAL_BUILDER_PREMIUM_LARGE_SALAD_MISSING:
    "منتج السلطة الكبيرة البريميوم غير موجود.",
  MEAL_BUILDER_PREMIUM_LARGE_SALAD_UNAVAILABLE:
    "السلطة الكبيرة البريميوم غير متاحة.",
  MEAL_BUILDER_PREMIUM_LARGE_SALAD_PRICE_MISSING:
    "سعر السلطة الكبيرة البريميوم غير مضبوط.",
  PREMIUM_LARGE_SALAD_EXTRA_PROTEIN_EXPOSED:
    "السلطة الكبيرة تعرض خيار بروتين إضافي غير مسموح.",
  PREMIUM_LARGE_SALAD_PROTEIN_NOT_ALLOWED:
    "السلطة الكبيرة تعرض بروتين غير مسموح.",
};

export const REQUIRED_SECTION_ORDER = [
  "premium",
  "sandwich",
  "chicken",
  "beef",
  "fish",
  "eggs",
  "carbs",
];

export const VISUAL_SECTION_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  premium: { ar: "مميز", en: "Premium" },
  sandwich: { ar: "ساندويتشات", en: "Sandwiches" },
  chicken: { ar: "دجاج", en: "Chicken" },
  beef: { ar: "لحم", en: "Beef" },
  fish: { ar: "سمك", en: "Fish" },
  eggs: { ar: "بيض", en: "Eggs" },
  carbs: { ar: "نشويات", en: "Carbs" },
};

export const PREMIUM_REQUIRED_KEYS = ["beef_steak", "shrimp", "salmon"];

export const SECTION_RULE_BADGES: Record<string, string[]> = {
  premium: [
    "خيارات بريميوم مطلوبة",
    "السلطة الكبيرة لها قواعد مستقلة",
  ],
  sandwich: ["وجبة كاملة", "لا تحتاج نشويات", "requiresBuilder=false"],
  beef: ["وجبة لحم واحدة كحد أقصى في اليوم"],
  carbs: [
    "حد أقصى نوعين من النشويات",
    "حد أقصى 300 جرام إجمالي",
    "تطبق فقط على الوجبات القابلة للتخصيص",
  ],
};
