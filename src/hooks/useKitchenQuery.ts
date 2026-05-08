/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchKitchenOperationsSummary,
  fetchKitchenOperationsList,
  executeKitchenAction,
  bulkLockDays,
} from "@/utils/fetchKitchenData";
import type {
  KitchenOperationsTab,
  KitchenUiStatus,
  KitchenOperationsMode,
} from "@/types/kitchenTypes";

export const useKitchenSummaryQuery = (date: string, branchId?: string) => {
  return useQuery({
    queryKey: ["kitchenSummary", date, branchId],
    queryFn: () => fetchKitchenOperationsSummary(date, branchId),
    enabled: !!date,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    placeholderData: (prev) => prev,
  });
};

export const useKitchenOperationsQuery = (params: {
  date: string;
  tab?: KitchenOperationsTab;
  status?: KitchenUiStatus | "all";
  mode?: KitchenOperationsMode | "all";
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [
      "kitchenOperations",
      params.date,
      params.tab,
      params.status,
      params.mode,
      params.search,
      params.page,
      params.limit,
    ],
    queryFn: () => fetchKitchenOperationsList(params),
    enabled: !!params.date,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    placeholderData: (prev) => prev,
  });
};

// ── Generic action mutation that calls the endpoint from the row action ──
export const useKitchenActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      endpoint,
      method,
      body,
    }: {
      endpoint: string;
      method: string;
      body?: any;
    }) => executeKitchenAction(endpoint, method, body),
    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
    },
  });
};

// ── Bulk lock mutation ──
export const useBulkLockMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => bulkLockDays(date),
    onSuccess: (data) => {
      toast.success(`تم قفل ${data.data.lockedCount} يوم بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
    },
    onError: () => toast.error("حدث خطأ أثناء قفل كل الأيام"),
  });
};
