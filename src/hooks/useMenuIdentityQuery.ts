import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchMenuIdentities,
  fetchMenuIdentityDetail,
  fetchMenuIdentityLinks,
  fetchAllIdentityLinks,
} from "@/utils/fetchMenuIdentities";
import {
  fetchMenuIdentitySuggestions,
  fetchMenuIdentitySuggestionDetail,
  fetchApproveSuggestion,
  fetchRejectSuggestion,
} from "@/utils/fetchMenuIdentitySuggestions";

import type {
  MenuIdentityListParams,
  MenuIdentityLinkListParams,
  MenuIdentitySuggestionListParams,
  SuggestionActionPayload,
} from "@/types/menuIdentityTypes";

// ── Query Keys ──

const IDENTITY_KEYS = {
  identities: (params: MenuIdentityListParams) =>
    ["menuIdentities", "list", params] as const,
  identityDetail: (id: string) =>
    ["menuIdentities", "detail", id] as const,
  identityLinks: (id: string) =>
    ["menuIdentities", "links", id] as const,
  allLinks: (params: MenuIdentityLinkListParams) =>
    ["menuIdentityLinks", "list", params] as const,
  suggestions: (params: MenuIdentitySuggestionListParams) =>
    ["menuIdentitySuggestions", "list", params] as const,
  suggestionDetail: (id: string) =>
    ["menuIdentitySuggestions", "detail", id] as const,
};

// ══════════════════════════════════════
// ── §16 Shared Menu Identities ──
// ══════════════════════════════════════

export const menuIdentitiesQueryOptions = (
  params: MenuIdentityListParams = {}
) =>
  queryOptions({
    queryKey: IDENTITY_KEYS.identities(params),
    queryFn: () => fetchMenuIdentities(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuIdentitiesQuery = (
  params: MenuIdentityListParams = {}
) => useQuery(menuIdentitiesQueryOptions(params));

export const menuIdentityDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: IDENTITY_KEYS.identityDetail(id),
    queryFn: () => fetchMenuIdentityDetail(id),
    enabled: !!id,
  });

export const useMenuIdentityDetailQuery = (id: string) =>
  useQuery(menuIdentityDetailQueryOptions(id));

export const menuIdentityLinksQueryOptions = (id: string) =>
  queryOptions({
    queryKey: IDENTITY_KEYS.identityLinks(id),
    queryFn: () => fetchMenuIdentityLinks(id),
    enabled: !!id,
  });

export const useMenuIdentityLinksQuery = (id: string) =>
  useQuery(menuIdentityLinksQueryOptions(id));

export const allIdentityLinksQueryOptions = (
  params: MenuIdentityLinkListParams = {}
) =>
  queryOptions({
    queryKey: IDENTITY_KEYS.allLinks(params),
    queryFn: () => fetchAllIdentityLinks(params),
    staleTime: 1000 * 60 * 2,
  });

export const useAllIdentityLinksQuery = (
  params: MenuIdentityLinkListParams = {}
) => useQuery(allIdentityLinksQueryOptions(params));

// ══════════════════════════════════════
// ── §17 Identity Suggestions ──
// ══════════════════════════════════════

export const menuIdentitySuggestionsQueryOptions = (
  params: MenuIdentitySuggestionListParams = {}
) =>
  queryOptions({
    queryKey: IDENTITY_KEYS.suggestions(params),
    queryFn: () => fetchMenuIdentitySuggestions(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuIdentitySuggestionsQuery = (
  params: MenuIdentitySuggestionListParams = {}
) => useQuery(menuIdentitySuggestionsQueryOptions(params));

export const menuIdentitySuggestionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: IDENTITY_KEYS.suggestionDetail(id),
    queryFn: () => fetchMenuIdentitySuggestionDetail(id),
    enabled: !!id,
  });

export const useMenuIdentitySuggestionDetailQuery = (id: string) =>
  useQuery(menuIdentitySuggestionDetailQueryOptions(id));

export const useApproveSuggestionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: SuggestionActionPayload;
    }) => fetchApproveSuggestion(id, data),
    onSuccess: () => {
      toast.success("تمت الموافقة على الاقتراح بنجاح");
      qc.invalidateQueries({ queryKey: ["menuIdentitySuggestions"] });
      qc.invalidateQueries({ queryKey: ["menuIdentities"] });
      qc.invalidateQueries({ queryKey: ["menuIdentityLinks"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء الموافقة على الاقتراح"
      );
    },
  });
};

export const useRejectSuggestionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: SuggestionActionPayload;
    }) => fetchRejectSuggestion(id, data),
    onSuccess: () => {
      toast.success("تم رفض الاقتراح");
      qc.invalidateQueries({ queryKey: ["menuIdentitySuggestions"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء رفض الاقتراح"
      );
    },
  });
};
