import api from "@/lib/apis";
import {
  accountingDailyReportExportUrl,
  accountingDailyReportUrl,
  dashboardHealthUrl,
  dashboardLogsUrl,
  dashboardNotificationsSummaryUrl,
  dashboardReportsTodayUrl,
  dashboardSearchUrl,
  notificationLogsUrl,
  subscriptionTermsUrl,
  type DashboardHealthKey,
} from "@/utils/dashboardApiContract";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

export const fetchDashboardSearch = async (q: string): Promise<unknown> => {
  const response = await api.get(dashboardSearchUrl(q));
  return response.data;
};

export const fetchDashboardNotificationsSummary =
  async (): Promise<unknown> => {
    const response = await api.get(dashboardNotificationsSummaryUrl());
    return response.data;
  };

export const fetchDashboardReportsToday = async (): Promise<unknown> => {
  const response = await api.get(dashboardReportsTodayUrl());
  return response.data;
};

export const fetchAccountingDailyReport = async (
  params: QueryParams = {}
): Promise<unknown> => {
  const response = await api.get(accountingDailyReportUrl(params));
  return response.data;
};

export const fetchAccountingDailyReportExport = async (
  params: QueryParams = {}
): Promise<Blob> => {
  const response = await api.get(accountingDailyReportExportUrl(params), {
    responseType: "blob",
  });
  return response.data;
};

export const fetchSubscriptionTerms = async (
  locale?: string
): Promise<unknown> => {
  const response = await api.get(subscriptionTermsUrl(locale));
  return response.data;
};

export const updateSubscriptionTerms = async (
  data: Record<string, unknown>
): Promise<unknown> => {
  const response = await api.put(subscriptionTermsUrl(), data);
  return response.data;
};

export const fetchDashboardLogs = async (
  params: QueryParams = {}
): Promise<unknown> => {
  const response = await api.get(dashboardLogsUrl(params));
  return response.data;
};

export const fetchNotificationLogs = async (
  params: QueryParams = {}
): Promise<unknown> => {
  const response = await api.get(notificationLogsUrl(params));
  return response.data;
};

export const fetchDashboardHealth = async (
  key: DashboardHealthKey
): Promise<unknown> => {
  const response = await api.get(dashboardHealthUrl(key));
  return response.data;
};
