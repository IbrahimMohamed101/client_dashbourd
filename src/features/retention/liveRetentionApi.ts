import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/apis";

export const LIVE_RETENTION_STATUSES = [
  "active", "due_soon", "grace_14", "overdue_14", "scheduled", "review", "canceled",
] as const;
export type LiveRetentionStatus = (typeof LIVE_RETENTION_STATUSES)[number];
export type RetentionFilterStatus = LiveRetentionStatus | "all";

export type LiveRetentionRow = {
  userId: string;
  doNotContact: boolean;
  name: string;
  phone: string;
  firstRecordedAt: string;
  lastRecordedAt: string;
  subscriptionRecordCount: number;
  status: LiveRetentionStatus;
  reason: string;
  dueDate: string | null;
  dueDateIsLatestValidityBound: boolean;
  remainingAndReserved: number | null;
  latestFollowup?: { createdAt: string; outcome: string; channel: string; actor: string } | null;
};

export type LiveRetentionResponse = {
  asOf: string;
  timezone: "Asia/Riyadh";
  mode: "live_operational_preview";
  definition: string;
  warnings: string[];
  totals: Record<LiveRetentionStatus | "all", number>;
  pagination: { page: number; pageSize: number; total: number };
  rows: LiveRetentionRow[];
};

export type LiveRetentionParams = {
  page: number;
  pageSize: number;
  status: RetentionFilterStatus;
  search: string;
  uncontactedOnly?: boolean;
  dueFrom?: string;
  dueTo?: string;
};

export async function fetchLiveRetention(params: LiveRetentionParams): Promise<LiveRetentionResponse> {
  const response = await api.get<{ status: boolean; data: LiveRetentionResponse }>(
    "/api/dashboard/customer-management/retention",
    { params }
  );
  const data = response.data?.data;
  if (data?.mode !== "live_operational_preview" || !Array.isArray(data.rows)) {
    throw new Error("الاستجابة غير مطابقة لتعريف تقرير التجديدات المباشر");
  }
  return data;
}

export function useLiveRetention(params: LiveRetentionParams) {
  return useQuery({
    queryKey: ["customer-retention-live", params],
    queryFn: () => fetchLiveRetention(params),
    staleTime: 30_000,
    // Keep the previous page on screen while a new filter/page loads so the cards and
    // filters do not unmount. Callers must treat `isPlaceholderData` rows as stale.
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
