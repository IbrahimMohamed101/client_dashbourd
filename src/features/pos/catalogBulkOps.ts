// Staging-only client-side draft helpers. The POS catalog remains separate from the app menu.
type DraftVariant = { id: string; prices: Record<string, string> };
type DraftProduct = { id: string; name: string; active?: boolean; variants: DraftVariant[]; allowedAddonIds?: string[] };
type DraftCatalog = { products: DraftProduct[] };

export type PriceCopyMode = "missing" | "overwrite";

/** Copies priced values only: an empty source price must never erase a destination price. */
export function copyChannelPrices<T extends DraftCatalog>(
  catalog: T,
  source: string,
  destination: string,
  productIds: ReadonlySet<string>,
  mode: PriceCopyMode,
): { catalog: T; changed: number } {
  if (!source || !destination || source === destination || !productIds.size) {
    return { catalog, changed: 0 };
  }
  let changed = 0;
  const products = catalog.products.map((product) => {
    if (!productIds.has(product.id)) return product;
    return {
      ...product,
      variants: product.variants.map((variant) => {
        const from = variant.prices[source]?.trim() ?? "";
        const to = variant.prices[destination]?.trim() ?? "";
        if (!from || from === to || (mode === "missing" && to)) return variant;
        changed += 1;
        return { ...variant, prices: { ...variant.prices, [destination]: from } };
      }),
    };
  });
  return changed ? { catalog: { ...catalog, products } as T, changed } : { catalog, changed: 0 };
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
