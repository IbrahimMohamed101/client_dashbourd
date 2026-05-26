import api from "@/lib/apis";
import type {
  SharedMenuIdentitiesResponse,
  SharedMenuIdentityDetailResponse,
  MenuIdentityLinksByIdentityResponse,
  MenuIdentityLinksResponse,
  MenuIdentityListParams,
  MenuIdentityLinkListParams,
} from "@/types/menuIdentityTypes";
import { buildListQuery } from "@/utils/buildListQuery";

// ── §16.1 List Shared Identities ──
// GET /api/dashboard/menu-identities

export const fetchMenuIdentities = async (
  params: MenuIdentityListParams = {}
): Promise<SharedMenuIdentitiesResponse> => {
  const response = await api.get(
    `/api/dashboard/menu-identities${buildListQuery(params)}`
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
  const response = await api.get(
    `/api/dashboard/menu-identity-links${buildListQuery(params)}`
  );
  return response.data;
};
