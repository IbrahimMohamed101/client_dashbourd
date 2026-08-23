import api from "@/lib/apis";
import type {
  CatalogItem,
  CatalogItemsResponse,
  CatalogNutrition,
} from "@/types/catalogItemTypes";

export async function fetchCatalogItems(
  search = ""
): Promise<CatalogItemsResponse> {
  const params = search.trim() ? { search: search.trim() } : undefined;
  const response = await api.get("/api/dashboard/catalog-items", { params });
  return response.data as CatalogItemsResponse;
}

export async function updateCatalogItemNutrition(
  id: string,
  nutrition: CatalogNutrition
): Promise<CatalogItem> {
  const response = await api.patch(`/api/dashboard/catalog-items/${id}`, {
    nutrition,
  });
  return response.data.data as CatalogItem;
}
