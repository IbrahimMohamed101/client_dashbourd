import api from "@/lib/apis";
import type {
  SharedMenuIdentitiesResponse,
  SharedMenuIdentityDetailResponse,
  MenuIdentityLinksByIdentityResponse,
  MenuIdentityLinksResponse,
  MenuIdentityListParams,
  MenuIdentityLinkListParams,
} from "@/types/menuIdentityTypes";

// ── §16.1 List Shared Identities ──
// GET /api/dashboard/menu-identities

export const fetchMenuIdentities = async (
  params: MenuIdentityListParams = {}
): Promise<SharedMenuIdentitiesResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.key) searchParams.append("key", params.key);
  if (params.type) searchParams.append("type", params.type);
  if (params.isActive !== undefined)
    searchParams.append("isActive", params.isActive.toString());

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu-identities${query ? `?${query}` : ""}`
  );
  return response.data;
};

// ── §16.2 Shared Identity Details ──
// GET /api/dashboard/menu-identities/:id

export const fetchMenuIdentityDetail = async (
  id: string
): Promise<SharedMenuIdentityDetailResponse> => {
  const response = await api.get(`/api/dashboard/menu-identities/${id}`);
  return response.data;
};

// ── §16.3 Shared Identity Links ──
// GET /api/dashboard/menu-identities/:id/links

export const fetchMenuIdentityLinks = async (
  id: string
): Promise<MenuIdentityLinksByIdentityResponse> => {
  const response = await api.get(
    `/api/dashboard/menu-identities/${id}/links`
  );
  return response.data;
};

// ── §16.4 All Identity Links ──
// GET /api/dashboard/menu-identity-links

export const fetchAllIdentityLinks = async (
  params: MenuIdentityLinkListParams = {}
): Promise<MenuIdentityLinksResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.channel) searchParams.append("channel", params.channel);
  if (params.sourceModel)
    searchParams.append("sourceModel", params.sourceModel);
  if (params.confidence) searchParams.append("confidence", params.confidence);
  if (params.status) searchParams.append("status", params.status);
  if (params.isActive !== undefined)
    searchParams.append("isActive", params.isActive.toString());

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu-identity-links${query ? `?${query}` : ""}`
  );
  return response.data;
};
