import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchSettings,
  fetchUpdateSettings,
  fetchRestaurantHours,
  fetchUpdateRestaurantHours,
} from "@/utils/fetchSettings";
import { fetchPickupBranches } from "@/utils/fetchPickupBranches";

import type {
  DashboardSettings,
  RestaurantHours,
} from "@/types/settingsTypes";

// ── Query Keys ──

const SETTINGS_KEYS = {
  settings: ["settings"] as const,
  restaurantHours: ["settings", "restaurantHours"] as const,
  pickupBranches: ["settings", "pickupBranches"] as const,
};

// ══════════════════════════════════════
// ── Dashboard Settings ──
// ══════════════════════════════════════

export const settingsQueryOptions = queryOptions({
  queryKey: SETTINGS_KEYS.settings,
  queryFn: fetchSettings,
  staleTime: 1000 * 60 * 5,
});

export const useSettingsQuery = () => useQuery(settingsQueryOptions);

export const useUpdateSettingsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DashboardSettings>) =>
      fetchUpdateSettings(data),
    onSuccess: () => {
      toast.success("تم تحديث الإعدادات بنجاح");
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.settings });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث الإعدادات"
      );
    },
  });
};

// ══════════════════════════════════════
// ── Restaurant Hours ──
// ══════════════════════════════════════

export const restaurantHoursQueryOptions = queryOptions({
  queryKey: SETTINGS_KEYS.restaurantHours,
  queryFn: fetchRestaurantHours,
  staleTime: 1000 * 60 * 5,
});

export const useRestaurantHoursQuery = () =>
  useQuery(restaurantHoursQueryOptions);

export const pickupBranchesQueryOptions = queryOptions({
  queryKey: SETTINGS_KEYS.pickupBranches,
  queryFn: fetchPickupBranches,
  staleTime: 1000 * 60 * 5,
});

export const usePickupBranchesQuery = () =>
  useQuery(pickupBranchesQueryOptions);

export const useUpdateRestaurantHoursMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RestaurantHours) => fetchUpdateRestaurantHours(data),
    onSuccess: () => {
      toast.success("تم تحديث ساعات العمل بنجاح");
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.restaurantHours });
      qc.invalidateQueries({ queryKey: SETTINGS_KEYS.settings });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث ساعات العمل"
      );
    },
  });
};
