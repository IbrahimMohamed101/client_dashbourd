import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  PremiumUpgradeCandidateFilters,
  PremiumUpgradeListFilters,
} from "@/types/premiumUpgradeTypes";
import {
  PREMIUM_UPGRADES_CANDIDATES_QUERY_KEY,
  PREMIUM_UPGRADES_LIST_QUERY_KEY,
  PREMIUM_UPGRADES_READINESS_QUERY_KEY,
  archivePremiumUpgrade,
  createPremiumUpgrade,
  fetchPremiumUpgradeCandidates,
  fetchPremiumUpgradeReadiness,
  fetchPremiumUpgrades,
  showPremiumUpgradeError,
  updatePremiumUpgrade,
  updatePremiumUpgradeState,
} from "@/utils/fetchPremiumUpgrades";

export function usePremiumUpgradesQuery(filters: PremiumUpgradeListFilters) {
  return useQuery({
    queryKey: [PREMIUM_UPGRADES_LIST_QUERY_KEY, filters],
    queryFn: () => fetchPremiumUpgrades(filters),
  });
}

export function usePremiumUpgradeReadinessQuery() {
  return useQuery({
    queryKey: [PREMIUM_UPGRADES_READINESS_QUERY_KEY],
    queryFn: fetchPremiumUpgradeReadiness,
  });
}

export function usePremiumUpgradeCandidatesQuery(
  filters: PremiumUpgradeCandidateFilters,
  enabled: boolean
) {
  return useQuery({
    queryKey: [PREMIUM_UPGRADES_CANDIDATES_QUERY_KEY, filters],
    queryFn: () => fetchPremiumUpgradeCandidates(filters),
    enabled,
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
        queryKey: [PREMIUM_UPGRADES_CANDIDATES_QUERY_KEY],
      });
    },
  };
}

export function useCreatePremiumUpgradeMutation(onSuccess?: () => void) {
  const { invalidatePremiumUpgrades } = usePremiumUpgradeInvalidation();

  return useMutation({
    mutationFn: createPremiumUpgrade,
    onSuccess: () => {
      toast.success("تم ربط العنصر كترقية مميزة.");
      invalidatePremiumUpgrades();
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}

export function useUpdatePremiumUpgradeMutation(onSuccess?: () => void) {
  const { invalidatePremiumUpgrades } = usePremiumUpgradeInvalidation();

  return useMutation({
    mutationFn: updatePremiumUpgrade,
    onSuccess: () => {
      toast.success("تم حفظ إعداد الترقية.");
      invalidatePremiumUpgrades();
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}

export function useUpdatePremiumUpgradeStateMutation(onSuccess?: () => void) {
  const { invalidatePremiumUpgrades } = usePremiumUpgradeInvalidation();

  return useMutation({
    mutationFn: updatePremiumUpgradeState,
    onSuccess: () => {
      toast.success("تم تحديث حالة الترقية.");
      invalidatePremiumUpgrades();
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}

export function useArchivePremiumUpgradeMutation(onSuccess?: () => void) {
  const { invalidatePremiumUpgrades } = usePremiumUpgradeInvalidation();

  return useMutation({
    mutationFn: archivePremiumUpgrade,
    onSuccess: () => {
      toast.success("تمت أرشفة الترقية المميزة.");
      invalidatePremiumUpgrades();
      onSuccess?.();
    },
    onError: showPremiumUpgradeError,
  });
}
