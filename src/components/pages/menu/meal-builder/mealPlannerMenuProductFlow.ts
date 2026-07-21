import type { MenuCategory, MenuProduct } from "@/types/menuTypes";
import type { MealPlannerSectionV2 } from "@/types/mealPlannerDashboardTypes";
import { normalizeCardType, selectedIdsForSection } from "./mealPlannerV2Utils";

export const UNCATEGORIZED_CATEGORY_ID = "__uncategorized__";

export type MealBuilderMenuProductCandidate = {
  id: string;
  key: string;
  name: { ar?: string; en?: string };
  imageUrl?: string;
  categoryId?: string | null;
  itemType?: string;
  cardVariant?: string;
  isActive?: boolean;
  isVisible?: boolean;
  isAvailable?: boolean;
  selected: boolean;
  assignedToCurrentCard: boolean;
  assignedToAnotherCard: boolean;
  assignedSectionKey?: string;
};

export function categoryLabel(category?: MenuCategory) {
  return category?.name?.ar || category?.name?.en || category?.key || "غير مصنف";
}

export function buildProductAssignments(sections: MealPlannerSectionV2[]) {
  const map = new Map<string, string>();
  for (const section of sections) {
    if (normalizeCardType(section) !== "direct_product") continue;
    for (const productId of selectedIdsForSection(section)) {
      map.set(String(productId), section.key);
    }
  }
  return map;
}

export function buildMenuProductCandidates({
  products,
  selectedIds,
  currentSectionKey,
  assignmentByProductId,
}: {
  products: MenuProduct[];
  selectedIds: string[];
  currentSectionKey?: string;
  assignmentByProductId: Map<string, string>;
}): MealBuilderMenuProductCandidate[] {
  return products.map((product) => {
    const id = String(product.id);
    const assignedSectionKey = assignmentByProductId.get(id);
    const assignedToCurrentCard = Boolean(
      assignedSectionKey && currentSectionKey && assignedSectionKey === currentSectionKey
    );
    return {
      id,
      key: product.key,
      name: product.name,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId ? String(product.categoryId) : null,
      itemType: product.itemType,
      cardVariant: product.ui?.cardVariant,
      isActive: product.isActive,
      isVisible: product.isVisible,
      isAvailable: product.isAvailable,
      selected: selectedIds.includes(id),
      assignedToCurrentCard,
      assignedToAnotherCard: Boolean(assignedSectionKey && !assignedToCurrentCard),
      assignedSectionKey,
    };
  });
}

export function filterMenuProductCandidates({
  candidates,
  categories,
  selectedCategoryId,
  search,
}: {
  candidates: MealBuilderMenuProductCandidate[];
  categories: MenuCategory[];
  selectedCategoryId: string;
  search: string;
}) {
  const categoryById = new Map(
    categories.map((category) => [String(category.id), category])
  );
  const query = search.trim().toLowerCase();
  return candidates.filter((candidate) => {
    const category = candidate.categoryId
      ? categoryById.get(String(candidate.categoryId))
      : undefined;
    const uncategorized = !category;
    if (
      selectedCategoryId !== "all" &&
      !(
        selectedCategoryId === UNCATEGORIZED_CATEGORY_ID
          ? uncategorized
          : String(candidate.categoryId || "") === selectedCategoryId
      )
    ) {
      return false;
    }
    if (!query) return true;
    return [
      candidate.key,
      candidate.name?.ar,
      candidate.name?.en,
      category?.name?.ar,
      category?.name?.en,
      category?.key,
      uncategorized ? "غير مصنف" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}
