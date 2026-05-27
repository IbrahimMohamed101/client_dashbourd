import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AccountingDailyReportParams,
  DashboardLogFilters,
  DashboardNotificationLogFilters,
  SubscriptionTermsPayload,
} from "@/types/dashboardAdminTypes";
import type { DashboardHealthKey } from "@/utils/dashboardApiContract";
import {
  createDashboardStaffUser,
  deleteDashboardStaffUser,
  fetchDashboardStaffUser,
  fetchDashboardStaffUsers,
  resetDashboardStaffUserPassword,
  updateDashboardStaffUser,
} from "@/utils/fetchDashboardUsers";
import {
  fetchAccountingDailyReport,
  fetchDashboardHealth,
  fetchDashboardLogs,
  fetchDashboardNotificationsSummary,
  fetchDashboardReportsToday,
  fetchNotificationLogs,
  fetchSubscriptionTerms,
  updateSubscriptionTerms,
} from "@/utils/fetchDashboardSupportData";

export const dashboardStaffUsersQueryOptions = (page = 1, limit = 20) =>
  queryOptions({
    queryKey: ["dashboard-staff-users", { page, limit }],
    queryFn: () => fetchDashboardStaffUsers({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

export const dashboardStaffUserQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["dashboard-staff-user", id],
    queryFn: () => fetchDashboardStaffUser(id),
    staleTime: 1000 * 60 * 5,
  });

export const dashboardNotificationSummaryQueryOptions = (limit?: number) =>
  queryOptions({
    queryKey: ["dashboard-notification-summary", { limit: limit ?? null }],
    queryFn: () => fetchDashboardNotificationsSummary(limit),
    staleTime: 1000 * 60,
  });

export const dashboardTodayReportQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard-today-report"],
    queryFn: fetchDashboardReportsToday,
    staleTime: 1000 * 60,
  });

export const accountingDailyReportQueryOptions = (
  params: AccountingDailyReportParams = {}
) =>
  queryOptions({
    queryKey: ["accounting-daily-report", params],
    queryFn: () => fetchAccountingDailyReport(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

export const dashboardLogsQueryOptions = (params: DashboardLogFilters = {}) =>
  queryOptions({
    queryKey: ["dashboard-logs", params],
    queryFn: () => fetchDashboardLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

export const dashboardNotificationLogsQueryOptions = (
  params: DashboardNotificationLogFilters = {}
) =>
  queryOptions({
    queryKey: ["dashboard-notification-logs", params],
    queryFn: () => fetchNotificationLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

export const subscriptionTermsQueryOptions = (locale?: string) =>
  queryOptions({
    queryKey: ["subscription-terms", locale ?? "default"],
    queryFn: () => fetchSubscriptionTerms(locale),
    staleTime: 1000 * 60 * 5,
  });

export const dashboardHealthQueryOptions = (key: DashboardHealthKey) =>
  queryOptions({
    queryKey: ["dashboard-health", key],
    queryFn: () => fetchDashboardHealth(key),
    staleTime: 1000 * 60,
  });

export const useDashboardStaffUsersQuery = (page = 1, limit = 20) =>
  useQuery(dashboardStaffUsersQueryOptions(page, limit));

export const useAccountingDailyReportQuery = (
  params: AccountingDailyReportParams = {}
) => useQuery(accountingDailyReportQueryOptions(params));

export const useCreateDashboardStaffUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDashboardStaffUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-users"] });
    },
  });
};

export const useUpdateDashboardStaffUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDashboardStaffUser,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-users"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-staff-user", variables.id],
      });
    },
  });
};

export const useDeleteDashboardStaffUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDashboardStaffUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-users"] });
    },
  });
};

export const useResetDashboardStaffUserPasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetDashboardStaffUserPassword,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-users"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-staff-user", variables.id],
      });
    },
  });
};

export const useUpdateSubscriptionTermsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubscriptionTermsPayload) =>
      updateSubscriptionTerms(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-terms"] });
    },
  });
};
