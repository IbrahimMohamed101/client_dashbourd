import { useQuery } from "@tanstack/react-query";

import api from "@/lib/apis";

export interface MarketingAnalyticsParams {
  from: string;
  to: string;
  comparePrevious?: boolean;
  promoCode?: string;
  fulfillmentMethod?: "all" | "delivery" | "pickup";
  paymentProvider?: "all" | "moyasar" | "cash" | "manual";
  daysCount?: number | null;
  grams?: number | null;
  mealsPerDay?: number | null;
}

export interface MarketingAnalyticsMetricComparison {
  current: number;
  previous: number;
  delta: number;
  changePercent: number | null;
  trend: "positive" | "negative" | "flat";
}

export interface MarketingAnalyticsKpis {
  registrations: number;
  loggedInUsers: number;
  checkoutStarted: number;
  checkoutUsers: number;
  pendingCheckouts: number;
  abandonedCheckouts: number;
  failedPayments: number;
  paidTransactions: number;
  paidCustomers: number;
  firstTimeSubscribers: number;
  repeatSubscribers: number;
  newRegistrationsPaid: number;
  cancellations: number;
  appRevenueHalala: number;
  totalSubscriptionRevenueHalala: number;
  aovHalala: number;
  registerToPaidRate: number;
  checkoutToPaidRate: number;
  repeatCustomerRate: number;
}

export interface MarketingAnalyticsBucket {
  key: string;
  labelAr?: string;
  count?: number;
  customersCount?: number;
  amountHalala?: number;
  paidTransactions?: number;
  revenueHalala?: number;
}

export interface MarketingPromoPerformance {
  code: string;
  attempts: number;
  consumed: number;
  reserved: number;
  cancelled: number;
  paidCount: number;
  discountHalala: number;
  revenueHalala: number;
  conversionRate: number;
}

export interface MarketingPlanPerformance {
  daysCount: number;
  grams: number;
  mealsPerDay: number;
  paidTransactions: number;
  customersCount: number;
  revenueHalala: number;
  discountHalala: number;
}

export interface MarketingDailyPoint {
  date: string;
  registrations: number;
  checkouts: number;
  paidTransactions: number;
  revenueHalala: number;
}

export interface MarketingAnalyticsReportData {
  reportType: "marketing_analytics";
  titleAr: string;
  timezone: string;
  currency: string;
  moneyUnit: string;
  range: {
    from: string;
    to: string;
    days: number;
    labelAr: string;
  };
  filters: {
    promoCode: string;
    fulfillmentMethod: string;
    paymentProvider: string;
    daysCount: number | null;
    grams: number | null;
    mealsPerDay: number | null;
  };
  kpis: MarketingAnalyticsKpis;
  comparison: {
    enabled: boolean;
    previousRange?: { from: string; to: string; days: number };
    metrics?: Record<string, MarketingAnalyticsMetricComparison>;
  };
  checkoutStatuses: MarketingAnalyticsBucket[];
  sourceChannels: MarketingAnalyticsBucket[];
  promoPerformance: MarketingPromoPerformance[];
  planPerformance: MarketingPlanPerformance[];
  fulfillmentPerformance: MarketingAnalyticsBucket[];
  paymentProviders: MarketingAnalyticsBucket[];
  daily: MarketingDailyPoint[];
  notes: string[];
  generatedAt: string;
}

export interface MarketingAnalyticsResponse {
  status: boolean;
  message?: string;
  messageAr?: string;
  data: MarketingAnalyticsReportData;
}

export async function fetchMarketingAnalytics(
  params: MarketingAnalyticsParams
): Promise<MarketingAnalyticsResponse> {
  const response = await api.get<MarketingAnalyticsResponse>(
    "/api/dashboard/accounting/marketing-analytics",
    {
      params: {
        ...params,
        promoCode: params.promoCode?.trim() || undefined,
        daysCount: params.daysCount || undefined,
        grams: params.grams || undefined,
        mealsPerDay: params.mealsPerDay || undefined,
      },
    }
  );
  return response.data;
}

export function useMarketingAnalyticsQuery(
  params: MarketingAnalyticsParams,
  enabled = true
) {
  return useQuery({
    queryKey: ["marketing-analytics", params],
    queryFn: () => fetchMarketingAnalytics(params),
    enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
