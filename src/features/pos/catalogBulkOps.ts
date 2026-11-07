// Staging-only client-side draft helpers. The POS catalog remains separate from the app menu.
type DraftVariant = { id: string; label?: string; prices: Record<string, string> };
type DraftProduct = { id: string; name: string; active?: boolean; variants: DraftVariant[]; allowedAddonIds?: string[]; defaultVariantId?: string };
type DraftCatalog = { products: DraftProduct[] };

export type PriceCopyMode = "missing" | "overwrite";
export type PriceCopyRounding = "none" | "half" | "whole";
export type PriceCopyOptions = {
  increasePercent?: number;
  rounding?: PriceCopyRounding;
  /** Explicit consent required to make a previously unpriced variant saleable. */
  allowNewPrices?: boolean;
};
export type PriceCopyChange = {
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  before: string;
  after: string;
  newlyPriced: boolean;
};
export type PriceCopyResult<T> = {
  catalog: T;
  changed: number;
  changes: PriceCopyChange[];
  blockedNewPrices: PriceCopyChange[];
  firstTimeProducts: string[];
};

/** Price copies are draft-only. A blank destination is unsaleable and stays blank by default. */
export function copyChannelPrices<T extends DraftCatalog>(
  catalog: T,
  source: string,
  destination: string,
  productIds: ReadonlySet<string>,
  mode: PriceCopyMode,
  options: PriceCopyOptions = {},
): PriceCopyResult<T> {
  const empty = (): PriceCopyResult<T> => ({
    catalog, changed: 0, changes: [], blockedNewPrices: [], firstTimeProducts: [],
  });
  if (!source || !destination || source === destination || !productIds.size) return empty();

  const percent = options.increasePercent ?? 0;
  if (!Number.isFinite(percent) || percent < 0 || percent > 300) {
    throw new Error("نسبة الزيادة يجب أن تكون من 0 إلى 300.");
  }
  const changes: PriceCopyChange[] = [];
  const blockedNewPrices: PriceCopyChange[] = [];
  const firstTimeProducts = new Set<string>();
  const products = catalog.products.map((product) => {
    if (!productIds.has(product.id)) return product;
    const previouslyUnavailable = product.variants.every((v) => !(v.prices[destination]?.trim()));
    return {
      ...product,
      variants: product.variants.map((variant) => {
        const from = variant.prices[source]?.trim() ?? "";
        const to = variant.prices[destination]?.trim() ?? "";
        if (!/^\\d{1,6}(\\.\\d{1,2})?$/.test(from) || Number(from) > 100000
          || (mode === "missing" && to)) return variant;
        let halalas = Math.round(Math.round(Number(from) * 100) * (100 + percent) / 100);
        if (options.rounding === "half") halalas = Math.ceil(halalas / 50) * 50;
        if (options.rounding === "whole") halalas = Math.ceil(halalas / 100) * 100;
        if (halalas > 10_000_000) return variant; // Same maximum as draft serialization.
        const next = (halalas / 100).toFixed(2);
        if (next === to) return variant;
        const item: PriceCopyChange = {
          productId: product.id, productName: product.name,
          variantId: variant.id, variantLabel: variant.label ?? variant.id,
          before: to || "غير مسعّر", after: next, newlyPriced: !to,
        };
        if (!to && !options.allowNewPrices) {
          blockedNewPrices.push(item);
          return variant;
        }
        changes.push(item);
        if (!to && previouslyUnavailable) firstTimeProducts.add(product.name);
        return { ...variant, prices: { ...variant.prices, [destination]: next } };
      }),
    };
  });
  return {
    catalog: changes.length ? { ...catalog, products } as T : catalog,
    changed: changes.length,
    changes,
    blockedNewPrices,
    firstTimeProducts: [...firstTimeProducts],
  };
}

/** A cloned product starts hidden so it cannot become saleable without explicit review and publish. */
export function duplicateDraftProduct<T extends DraftProduct>(
  product: T,
  newId: string,
  newVariantIds: string[],
): T {
  if (!newId || newId === product.id || newVariantIds.length !== product.variants.length
    || new Set(newVariantIds).size !== newVariantIds.length
    || newVariantIds.some((id) => !id || product.variants.some((variant) => variant.id === id))) {
    throw new Error("تعذر إنشاء نسخة بمعرفات مستقلة.");
  }
  return {
    ...product,
    id: newId,
    name: ("نسخة من " + product.name).slice(0, 100),
    active: false,
    defaultVariantId: product.defaultVariantId
      ? newVariantIds[product.variants.findIndex((variant) => variant.id === product.defaultVariantId)]
      : undefined,
    allowedAddonIds: product.allowedAddonIds ? [...product.allowedAddonIds] : undefined,
    variants: product.variants.map((variant, index) => ({
      ...variant,
      id: newVariantIds[index],
      prices: { ...variant.prices },
    })),
  };
}
