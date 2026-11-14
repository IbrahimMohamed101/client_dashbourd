import { channels as legacyChannels, type Catalog, type Product, type Variant } from "./previewCatalog";

export type CatalogChange = {
  id: string;
  kind: "price" | "product" | "structure";
  label: string;
  before: string;
  after: string;
};

const toText = (value: string | undefined) => value?.trim() || "—";
const stateText = (active: boolean | undefined) => active === false ? "مخفي" : "ظاهر";
const priceText = (amount: number | null | undefined) =>
  amount == null ? "غير مسعّر" : amount === 0 ? "مجاني (0 ر.س)" : (amount / 100).toFixed(2) + " ر.س";

export function getPosCatalogChanges(before: Catalog, after: Catalog): CatalogChange[] {
  const result: CatalogChange[] = [];
  let nextId = 0;
  const add = (kind: CatalogChange["kind"], label: string, oldValue: string, newValue: string) => {
    if (oldValue === newValue) return;
    result.push({ id: String(++nextId), kind, label, before: oldValue, after: newValue });
  };
  const previousChannels = before.channels ?? [...legacyChannels];
  const nextChannels = after.channels ?? [...legacyChannels];
  const channels = new Map([...previousChannels, ...nextChannels].map((entry) => [entry.id, entry]));
  for (const channel of nextChannels) {
    const original = previousChannels.find((entry) => entry.id === channel.id);
    add("structure", "قناة بيع · " + channel.id, toText(original?.label), channel.label);
  }
  for (const channel of previousChannels) {
    if (!nextChannels.some((entry) => entry.id === channel.id)) {
      add("structure", "إزالة قناة بيع", channel.label, "محذوفة");
    }
  }
  for (const category of after.categories) {
    const original = before.categories.find((entry) => entry.id === category.id);
    add("structure", "تصنيف · " + category.id, toText(original?.label), category.label);
  }
  for (const category of before.categories) {
    if (!after.categories.some((entry) => entry.id === category.id)) {
      add("structure", "إزالة تصنيف", category.label, "محذوف");
    }
  }

  const oldProducts = new Map(before.products.map((item) => [item.id, item]));
  const newProducts = new Map(after.products.map((item) => [item.id, item]));
  for (const product of after.products) {
    const old = oldProducts.get(product.id);
    const itemLabel = product.name || "صنف جديد";
    if (!old) add("product", "إضافة صنف", "غير موجود", itemLabel);
    else {
      add("product", "اسم الصنف · " + itemLabel, old.name, product.name);
      add("product", "تصنيف · " + itemLabel, old.category, product.category);
      add("product", "ظهور · " + itemLabel, stateText(old.active), stateText(product.active));
      add("product", "إضافات · " + itemLabel, old.hasAddons === true ? "مسموحة" : "غير مسموحة", product.hasAddons === true ? "مسموحة" : "غير مسموحة");
      add("product", "بيع منفرد · " + itemLabel, old.sellStandalone === true ? "نعم" : "لا", product.sellStandalone === true ? "نعم" : "لا");
      add("product", "الحجم الافتراضي · " + itemLabel, toText(old.defaultVariantId), toText(product.defaultVariantId));
      const allowed = (item: Product) => item.allowedAddonIds == null ? "كل الإضافات" : [...item.allowedAddonIds].sort().join("، ") || "بدون إضافات";
      add("product", "الإضافات المسموحة · " + itemLabel, allowed(old), allowed(product));
    }
    const oldVariants = new Map(old?.variants.map((item) => [item.id, item]) ?? []);
    for (const variant of product.variants) {
      const prior = oldVariants.get(variant.id);
      const sizeLabel = itemLabel + " · " + (variant.label || variant.id);
      if (!prior) add("structure", "إضافة حجم · " + itemLabel, "غير موجود", variant.label || variant.id);
      else add("structure", "اسم الحجم · " + itemLabel, prior.label, variant.label);
      for (const [channelId, channel] of channels) {
        const oldPrice = prior?.prices[channelId];
        const newPrice = variant.prices[channelId];
        if (newPrice !== oldPrice && (newPrice != null || oldPrice != null)) {
          add("price", sizeLabel + " · " + channel.label, priceText(oldPrice), priceText(newPrice));
        }
      }
    }
    for (const variant of old?.variants ?? []) {
      if (!product.variants.some((entry: Variant) => entry.id === variant.id)) {
        add("structure", "إزالة حجم · " + itemLabel, variant.label || variant.id, "محذوف");
      }
    }
  }
  for (const product of before.products) {
    if (!newProducts.has(product.id)) {
      add("product", "إزالة صنف", product.name, "محذوف");
    }
  }
  return result;
}
