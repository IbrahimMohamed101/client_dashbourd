import type {
  NotificationLogFilters,
  NotificationLogsResponse,
  NotificationSummaryResponse,
} from "@/types/notificationTypes";
import {
  fetchDashboardNotificationsSummary,
  fetchNotificationLogs,
} from "@/utils/fetchDashboardSupportData";

export const fetchNotificationsSummary = async (
  limit?: number
): Promise<NotificationSummaryResponse> =>
  fetchDashboardNotificationsSummary(limit) as Promise<NotificationSummaryResponse>;

export const fetchNotificationsLogs = async (
  params: NotificationLogFilters = {}
): Promise<NotificationLogsResponse> =>
  fetchNotificationLogs(params) as Promise<NotificationLogsResponse>;
