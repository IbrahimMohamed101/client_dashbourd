import type { DashboardPaginationMeta, JsonValue } from "@/types/dashboardAdminTypes";

export interface NotificationSummaryItem {
  id: string;
  title: string;
  body: string;
  type: string | null;
  status: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string | null;
}

export interface NotificationRecentActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  byRole: string | null;
  createdAt: string | null;
}

export interface NotificationSummaryData {
  unreadCount: number;
  unreadWindowHours: number;
  failedCount: number;
  processingCount: number;
  recent: NotificationSummaryItem[];
  recentActivity: NotificationRecentActivityItem[];
}

export interface NotificationSummaryResponse {
  status: boolean;
  data: NotificationSummaryData;
}

export interface NotificationLog {
  _id?: string;
  id?: string;
  userId?: string;
  type?: string;
  dedupeKey?: string;
  entityType?: string;
  entityId?: string;
  title: string;
  body: string;
  data?: JsonValue;
  scheduledFor?: string | null;
  sentAt?: string | null;
  status: "processing" | "sent" | "failed" | "no_tokens" | string;
  error?: string;
  successCount?: number;
  failureCount?: number;
  errorCodes?: string[];
  retryCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

export interface NotificationLogsResponse {
  status: boolean;
  data: NotificationLog[];
  meta: DashboardPaginationMeta;
}
