import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  PremiumUpgradeConfigDto,
  PremiumUpgradeListFilters,
  PremiumUpgradeSourceFilters,
} from "@/types/premiumUpgradeTypes";
import {
  PREMIUM_UPGRADES_DETAIL_QUERY_KEY,
  PREMIUM_UPGRADES_LIST_QUERY_KEY,
  PREMIUM_UPGRADES_READINESS_QUERY_KEY,
  PREMIUM_UPGRADES_SOURCES_QUERY_KEY,
  archivePremiumUpgrade,
  createPremiumUpgrade,
  fetchPremiumUpgradeDetail,
  fetchPremiumUpgradeReadiness,
  fetchPremiumUpgradeSources,
  fetchPremiumUpgrades,
  showPremiumUpgradeError,
  updatePremiumUpgrade,
} from "@/utils/fetchPremiumUpgrades";

const PREMIUM_LIST_STALE_TIME = 2 * 60 * 1000;
const PREMIUM_READINESS_STALE_TIME = 2 * 60 * 1000;
const PREMIUM_SOURCES_STALE_TIME = 5 * 60 * 1000;
const PREMIUM_CACHE_GC_TIME = 15 * 60 * 1000;
const PREMIUM_UPGRADES_SOURCES_QUERY_VERSION = "v3";

export function usePremiumUpgradesQuery(filters: PremiumUpgradeListFilters) {
  return useQuery({
    queryKey: [PREMIUM_UPGRADES_LIST_QUERY_KEY, filters],
    queryFn: () => fetchPremiumUpgrades(filters),
    staleTime: PREMIUM_LIST_STALE_TIME,
    gcTime: PREMIUM_CACHE_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
}

export function usePremiumUpgradeReadinessQuery() {
  return useQuery({
    queryKey: [PREMIUM_UPGRADES_READINESS_QUERY_KEY],
    queryFn: fetchPremiumUpgradeReadiness,
    staleTime: PREMIUM_READINESS_STALE_TIME,
    gcTime: PREMIUM_CACHE_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function usePremiumUpgradeSourcesQuery(
  filters: PremiumUpgradeSourceFilters,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      PREMIUM_UPGRADES_SOURCES_QUERY_KEY,
      PREMIUM_UPGRADES_SOURCES_QUERY_VERSION,
      filters,
    ],
    queryFn: () => fetchPremiumUpgradeSources(filters),
    enabled,
    staleTime: PREMIUM_SOURCES_STALE_TIME,
    gcTime: PREMIUM_CACHE_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
}

export function usePremiumUpgradeDetailQuery(id: string | null) {
  return useQuery({
    queryKey: [PREMIUM_UPGRADES_DETAIL_QUERY_KEY, id],
    queryFn: () => fetchPremiumUpgradeDetail(id as string),
    enabled: Boolean(id),
    staleTime: PREMIUM_LIST_STALE_TIME,
    gcTime: PREMIUM_CACHE_GC_TIME,
    refetchOnWindowFocus: false,
  });
}

export function usePremiumUpgradeInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidatePremiumUpgrades() {
      queryClient.invalidateQueries({
        queryKey: [PREMIUM_UPGRADES_LIST_QUERY_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [PREMIUM_UPGRADES_READINESS_QUERY_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [PREMIUM_UPGRADES_SOURCES_QUERY_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [PREMIUM_UPGRADES_DETAIL_QUERY_KEY],
      });
    },
  };
}

function invalidatePremiumQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    queryKey: [PREMIUM_UPGRADES_LIST_QUERY_KEY],
    refetchType: "active",
  });
  queryClient.invalidateQueries({
    queryKey: [PREMIUM_UPGRADES_READINESS_QUERY_KEY],
    refetchType: "active",
  });
  queryClient.invalidateQueries({
    queryKey: [PREMIUM_UPGRADES_SOURCES_QUERY_KEY],
    refetchType: "active",
  });
  queryClient.invalidateQueries({
    queryKey: [PREMIUM_UPGRADES_DETAIL_QUERY_KEY],
    refetchType: "active",
  });
}

function patchPremiumUpgradeInListCaches(
  queryClient: QueryClient,
  updatedRow: PremiumUpgradeConfigDto
) {
  queryClient.setQueriesData(
    { queryKey: [PREMIUM_UPGRADES_LIST_QUERY_KEY] },
    (oldData: unknown) => {
      if (!oldData || typeof oldData !== "object") return oldData;

      const current = oldData as {
        data?: PremiumUpgradeConfigDto[];
        meta?: unknown;
        status?: boolean;
      };

      if (!Array.isArray(current.data)) return oldData;

      return {
        ...current,
        data: current.data.map((row) =>
          row.id === updatedRow.id ? updatedRow : row
        ),
      };
    }
  );
}

export function useCreatePremiumUpgradeMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPremiumUpgrade,
    onSuccess: () => {
      toast.success("تم ربط المصدر كترقية مميزة.");
      invalidatePremiumQueries(queryClient);
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}

export function useUpdatePremiumUpgradeMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePremiumUpgrade,
    onSuccess: (response) => {
      toast.success("تم حفظ إعداد الترقية.");
      patchPremiumUpgradeInListCaches(queryClient, response.data);
      invalidatePremiumQueries(queryClient);
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}

export function useArchivePremiumUpgradeMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archivePremiumUpgrade,
    onSuccess: (response) => {
      toast.success("تمت أرشفة الترقية المميزة.");
      patchPremiumUpgradeInListCaches(queryClient, response.data);
      invalidatePremiumQueries(queryClient);
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}
