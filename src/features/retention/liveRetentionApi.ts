import { useQuery } from "@tanstack/react-query";
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
};

export async function fetchLiveRetention(params: LiveRetentionParams): Promise<LiveRetentionResponse> {
  const response = await api.get<{ status: boolean; data: LiveRetentionResponse }>(
    "/api/dashboard/customer-management/retention",
    { params, headers: { "Cache-Control": "no-cache" } }
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
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
