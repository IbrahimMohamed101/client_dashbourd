import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { NotificationLogFilters } from "@/types/notificationTypes";
import {
  fetchNotificationsLogs,
  fetchNotificationsSummary,
} from "@/utils/fetchNotifications";

export const notificationsSummaryQueryOptions = (limit?: number) =>
  queryOptions({
    queryKey: ["notifications", "summary", { limit: limit ?? null }],
    queryFn: () => fetchNotificationsSummary(limit),
    staleTime: 1000 * 60,
  });

export const notificationLogsQueryOptions = (
  params: NotificationLogFilters = {}
) =>
  queryOptions({
    queryKey: ["notifications", "logs", params],
    queryFn: () => fetchNotificationsLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

export const useNotificationsSummaryQuery = (limit?: number) =>
  useQuery(notificationsSummaryQueryOptions(limit));

export const useNotificationLogsQuery = (
  params: NotificationLogFilters = {}
) => useQuery(notificationLogsQueryOptions(params));
