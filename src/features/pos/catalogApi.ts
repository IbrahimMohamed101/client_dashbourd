import api from "@/lib/apis";
import type { Catalog } from "./previewCatalog";

export type PublishedPosCatalog = Catalog & { revision: number };
export type PosCatalogManagerState = {
  revision: number;
  publishedRevision: number;
  published: Catalog;
  draft: Catalog | null;
  draftSavedBy?: { id: string; name: string | null; email: string; role: string } | null;
  draftSavedAt?: string | null;
  publishedBy?: { id: string; name: string | null; email: string; role: string } | null;
  publishedAt?: string | null;
};

export const posCatalogKey = ["pos-catalog", "published"] as const;
export const posManagerKey = ["pos-catalog", "manage"] as const;
const path = "/api/dashboard/pos/catalog";

export async function fetchPosCatalog() {
  const response = await api.get<{ data: PublishedPosCatalog }>(path);
  return response.data.data;
}

export async function fetchPosManager() {
  const response = await api.get<{ data: PosCatalogManagerState }>(
    path + "/manage"
  );
  return response.data.data;
}

export async function savePosDraft(revision: number, catalog: Catalog) {
  const response = await api.put<{ data: PosCatalogManagerState }>(
    path + "/draft",
    { revision, catalog }
  );
  return response.data.data;
}

export async function publishPosDraft(revision: number) {
  const response = await api.post<{ data: PosCatalogManagerState }>(
    path + "/publish",
    { revision }
  );
  return response.data.data;
}
