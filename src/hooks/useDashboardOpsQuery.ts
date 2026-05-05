import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchDashboardOpsList,
  fetchDashboardOpsSearch,
  executeDashboardOpsAction,
} from "@/utils/fetchDashboardOpsData";
import type { DashboardOpsActionRequest } from "@/types/dashboardOpsTypes";

// ── Query keys (single source of truth) ──

const KEYS = {
  list: (date: string) => ["dashboardOpsList", date] as const,
  search: (q: string) => ["dashboardOpsSearch", q] as const,
};

// ── Fetch all ops for a given date ──

export const useDashboardOpsListQuery = (date: string) =>
  useQuery({
    queryKey: KEYS.list(date),
    queryFn: () => fetchDashboardOpsList(date),
    enabled: !!date,
    refetchInterval: 30_000, // live-poll every 30s for delivery tracking
  });

// ── Search across ops ──

export const useDashboardOpsSearchQuery = (query: string) =>
  useQuery({
    queryKey: KEYS.search(query),
    queryFn: () => fetchDashboardOpsSearch(query),
    enabled: query.length >= 3,
  });

// ── Execute an action (dispatch / delivered / cancel / arriving_soon) ──

export const useDashboardOpsActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      payload,
    }: {
      action: string;
      payload: DashboardOpsActionRequest;
    }) => executeDashboardOpsAction(action, payload),

    onSuccess: (data) => {
      toast.success(
        data?.data?.ui?.label
          ? `تم تحديث الحالة إلى: ${data.data.ui.label}`
          : "تم تنفيذ الإجراء بنجاح",
      );
      // Invalidate both list and search queries to ensure freshness
      queryClient.invalidateQueries({ queryKey: ["dashboardOpsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardOpsSearch"] });
      // Keep one-time orders and kitchen boards in sync
      queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
    },

    onError: (
      error: Error & { response?: { data?: { message?: string } } },
    ) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
    },
  });
};
