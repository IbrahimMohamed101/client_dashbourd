import type { MealBuilderSection } from "@/types/mealBuilderTypes";
import { isPremiumManagedSection } from "./mealBuilderUtils";

export function isDirectProductCard(section: MealBuilderSection) {
  return (
    !isPremiumManagedSection(section) &&
    section.sectionType === "product_list" &&
    (section.sourceKind === "product_list" ||
      section.metadata?.cardKind === "direct_products" ||
      section.selectedProductIds.length > 0)
  );
}

export function selectedProductsForDirectCard(section: MealBuilderSection) {
  const source = section.selectedProducts?.length
    ? section.selectedProducts
    : (section.items ?? []).filter((item) => item.type?.includes("product"));
  const seen = new Set<string>();
  return source.filter((item) => {
    const id = item.productId || item.id || item.key;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function productIdsForDirectCard(section: MealBuilderSection) {
  const hydratedIds = selectedProductsForDirectCard(section)
    .map((item) => item.productId || item.id)
    .filter((id): id is string => Boolean(id));
  return uniqueIds(hydratedIds.length ? hydratedIds : section.selectedProductIds);
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}
