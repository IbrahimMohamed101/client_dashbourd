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
