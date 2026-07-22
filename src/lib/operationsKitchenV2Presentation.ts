import type {
  KitchenAddonGroup,
  KitchenCard,
  KitchenComponentItem,
  KitchenSection,
  KitchenSectionItem,
  KitchenV2,
  LocalizedText,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

export const UNSUPPORTED_KITCHEN_MESSAGE =
  "تعذر عرض تفاصيل التحضير: إصدار بيانات المطبخ غير مدعوم";

export function formatOperationsSar(
  value: number | null | undefined,
  fallback = ""
): string {
  if (value === null || value === undefined) return fallback;
  return `${(value / 100).toFixed(2)} ر.س`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function scalar(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function localized(value: unknown): LocalizedText | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    ar: scalar(record.ar),
    en: scalar(record.en),
  };
}

export function resolveOperationsLocalizedText(
  value: {
    nameI18n?: LocalizedText | null;
    name?: string | LocalizedText | null;
    titleI18n?: LocalizedText | null;
    title?: string | LocalizedText | null;
    labelI18n?: LocalizedText | null;
    label?: string | LocalizedText | null;
  },
  fallback: string
): string {
  const nameI18n = localized(value.nameI18n);
  const name = localized(value.name);
  const titleI18n = localized(value.titleI18n);
  const title = localized(value.title);
  const labelI18n = localized(value.labelI18n);
  const label = localized(value.label);

  return (
    nameI18n?.ar ||
    name?.ar ||
    titleI18n?.ar ||
    title?.ar ||
    labelI18n?.ar ||
    label?.ar ||
    scalar(value.name) ||
    scalar(value.title) ||
    scalar(value.label) ||
    nameI18n?.en ||
    name?.en ||
    titleI18n?.en ||
    title?.en ||
    labelI18n?.en ||
    label?.en ||
    fallback
  );
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function quantity(value: unknown, fallback = 1): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function warningText(value: unknown): string {
  const direct = scalar(value);
  if (direct) return direct;
  const record = asRecord(value);
  if (!record) return "";
  return (
    scalar(record.ar) ||
    scalar(record.messageAr) ||
    scalar(record.label) ||
    scalar(record.title) ||
    scalar(record.message) ||
    scalar(record.en) ||
    scalar(record.messageEn) ||
    scalar(record.code) ||
    ""
  );
}

function saladSummary(card: KitchenCard) {
  const salad = asRecord(card.components?.salad);
  return {
    sectionCount: positiveNumber(salad?.sectionCount),
    itemCount: positiveNumber(salad?.itemCount),
  };
}

export function isKitchenV2(kitchen: unknown): kitchen is KitchenV2 {
  return Boolean(
    kitchen &&
      typeof kitchen === "object" &&
      (kitchen as KitchenV2).version === "v2" &&
      Array.isArray((kitchen as KitchenV2).cards) &&
      Array.isArray((kitchen as KitchenV2).addonGroups) &&
      Array.isArray((kitchen as KitchenV2).warnings)
  );
}

export function getKitchenV2(item: UnifiedQueueItem): KitchenV2 | null {
  return isKitchenV2(item.kitchen) ? item.kitchen : null;
}

export interface PresentedKitchenComponent {
  name: string;
  quantity: number;
  grams: number | null;
}

export interface PresentedKitchenSectionItem extends PresentedKitchenComponent {}

export interface PresentedKitchenSection {
  key: string;
  label: string;
  items: PresentedKitchenSectionItem[];
}

export interface PresentedKitchenCard {
  key: string;
  type: string;
  title: string;
  badge: string | null;
  quantity: number;
  notes: string | null;
  warnings: string[];
  sectionCount: number;
  itemCount: number;
  product: PresentedKitchenComponent | null;
  protein: PresentedKitchenComponent | null;
  carbs: PresentedKitchenComponent[];
  sections: PresentedKitchenSection[];
}

export interface PresentedKitchenAddonGroup {
  key: string;
  label: string;
  items: PresentedKitchenComponent[];
}

export interface PresentedKitchenV2 {
  supported: boolean;
  unsupportedMessage?: string;
  mealCount: number;
  cardCount: number;
  addonGroupCount: number;
  addonItemCount: number;
  warningMessages: string[];
  cards: PresentedKitchenCard[];
  addonGroups: PresentedKitchenAddonGroup[];
  isEmptyKitchenDay: boolean;
  searchText: string;
}

function presentComponent(
  item: KitchenComponentItem,
  fallback: string
): PresentedKitchenComponent {
  return {
    name: resolveOperationsLocalizedText(item, fallback),
    quantity: quantity(item.quantity),
    grams: positiveNumber(item.grams),
  };
}

function presentSectionItem(item: KitchenSectionItem): PresentedKitchenSectionItem {
  return {
    name: resolveOperationsLocalizedText(item, "مكوّن غير محدد"),
    quantity: quantity(item.quantity),
    grams: positiveNumber(item.grams),
  };
}

function presentSection(section: KitchenSection, index: number): PresentedKitchenSection {
  return {
    key: section.key || `section-${index}`,
    label: resolveOperationsLocalizedText(section, "قسم غير محدد"),
    items: (section.items ?? []).map(presentSectionItem),
  };
}

function presentCard(card: KitchenCard, index: number): PresentedKitchenCard {
  const sections = (card.sections ?? []).map(presentSection);
  const carbs = Array.isArray(card.components?.carbs)
    ? card.components.carbs
    : [];
  const salad = saladSummary(card);

  return {
    key: card.cardId || card.id || card.slotKey || `${card.type}-${index}`,
    type: card.type,
    title: resolveOperationsLocalizedText(card, "وجبة غير محددة"),
    badge: card.badge
      ? resolveOperationsLocalizedText({ label: card.badge }, "") || null
      : null,
    quantity: quantity(card.quantity),
    notes: scalar(card.notes),
    warnings: (card.warnings ?? []).map(warningText).filter(Boolean),
    sectionCount: salad.sectionCount ?? sections.length,
    itemCount:
      salad.itemCount ??
      sections.reduce((sum, section) => sum + section.items.length, 0),
    product: card.components?.product
      ? presentComponent(card.components.product, "صنف غير محدد")
      : null,
    protein: card.components?.protein
      ? presentComponent(card.components.protein, "بروتين غير محدد")
      : null,
    carbs: carbs.map((carb) => presentComponent(carb, "كارب غير محدد")),
    sections,
  };
}

function presentAddonGroup(
  group: KitchenAddonGroup,
  index: number
): PresentedKitchenAddonGroup {
  return {
    key: `${group.addonPlanId || group.balanceBucketId || "addons"}-${index}`,
    label: resolveOperationsLocalizedText(group, "إضافات"),
    items: (group.items ?? []).map((item) => ({
      name: resolveOperationsLocalizedText(item, "إضافة غير محددة"),
      quantity: quantity(item.quantity),
      grams: positiveNumber(item.grams),
    })),
  };
}

export function buildKitchenV2Presentation(item: UnifiedQueueItem): PresentedKitchenV2 {
  const kitchen = getKitchenV2(item);
  if (!kitchen) {
    return {
      supported: false,
      unsupportedMessage: UNSUPPORTED_KITCHEN_MESSAGE,
      mealCount: 0,
      cardCount: 0,
      addonGroupCount: 0,
      addonItemCount: 0,
      warningMessages: [],
      cards: [],
      addonGroups: [],
      isEmptyKitchenDay: false,
      searchText: "",
    };
  }

  const cards = kitchen.cards.map(presentCard);
  const addonGroups = kitchen.addonGroups.map(presentAddonGroup);
  const warningMessages = kitchen.warnings.map(warningText).filter(Boolean);
  const addonItemCount = addonGroups.reduce(
    (sum, group) =>
      sum + group.items.reduce((inner, addon) => inner + addon.quantity, 0),
    0
  );
  const searchText = [
    ...cards.flatMap((entry) => [
      entry.title,
      entry.badge,
      entry.product?.name,
      entry.protein?.name,
      ...entry.carbs.map((carb) => carb.name),
      ...entry.sections.flatMap((section) => [
        section.label,
        ...section.items.map((sectionItem) => sectionItem.name),
      ]),
      ...entry.warnings,
    ]),
    ...addonGroups.flatMap((group) => [
      group.label,
      ...group.items.map((addon) => addon.name),
    ]),
    ...warningMessages,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    supported: true,
    mealCount: kitchen.mealCount,
    cardCount: cards.length,
    addonGroupCount: addonGroups.length,
    addonItemCount,
    warningMessages,
    cards,
    addonGroups,
    isEmptyKitchenDay:
      kitchen.mealCount === 0 &&
      kitchen.cards.length === 0 &&
      kitchen.addonGroups.length === 0,
    searchText,
  };
}
