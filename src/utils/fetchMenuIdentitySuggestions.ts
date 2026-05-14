import api from "@/lib/apis";
import type {
  MenuIdentitySuggestionsResponse,
  MenuIdentitySuggestionDetailResponse,
  MenuIdentitySuggestionListParams,
  SuggestionActionPayload,
} from "@/types/menuIdentityTypes";

// ── §17.1 List Suggestions ──
// GET /api/dashboard/menu-identity-suggestions

export const fetchMenuIdentitySuggestions = async (
  params: MenuIdentitySuggestionListParams = {}
): Promise<MenuIdentitySuggestionsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.status) searchParams.append("status", params.status);
  if (params.confidence) searchParams.append("confidence", params.confidence);
  if (params.type) searchParams.append("type", params.type);

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu-identity-suggestions${query ? `?${query}` : ""}`
  );
  return response.data;
};

// ── §17.2 Suggestion Details ──
// GET /api/dashboard/menu-identity-suggestions/:id

export const fetchMenuIdentitySuggestionDetail = async (
  id: string
): Promise<MenuIdentitySuggestionDetailResponse> => {
  const response = await api.get(
    `/api/dashboard/menu-identity-suggestions/${id}`
  );
  return response.data;
};

// ── §17.3 Approve Suggestion ──
// POST /api/dashboard/menu-identity-suggestions/:id/approve
// Creates/uses SharedMenuIdentity + MenuIdentityLink + ActivityLog.
// Does NOT change /api/orders/menu.

export const fetchApproveSuggestion = async (
  id: string,
  data: SuggestionActionPayload = {}
): Promise<void> => {
  await api.post(
    `/api/dashboard/menu-identity-suggestions/${id}/approve`,
    data
  );
};

// ── §17.4 Reject Suggestion ──
// POST /api/dashboard/menu-identity-suggestions/:id/reject

export const fetchRejectSuggestion = async (
  id: string,
  data: SuggestionActionPayload = {}
): Promise<void> => {
  await api.post(
    `/api/dashboard/menu-identity-suggestions/${id}/reject`,
    data
  );
};
