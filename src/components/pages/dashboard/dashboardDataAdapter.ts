import type {
  DashboardOverviewData,
  DashboardOverviewStats,
} from "@/types/dashboardHomeTypes";

export type DashboardMetricKey = keyof DashboardOverviewStats;

export type DashboardMetricRow = {
  key: DashboardMetricKey;
  label: string;
  shortLabel: string;
  value: number;
  fill: string;
};

export type DashboardTrendRow = {
  date: string;
  orders: number;
  subscriptions: number;
};

export type DashboardStatusRow = {
  status: string;
  value: number;
  fill: string;
};

const metricMeta: Array<{
  key: DashboardMetricKey;
  label: string;
  shortLabel: string;
  fill: string;
}> = [
  {
    key: "appUsers",
    label: "مستخدمو التطبيق",
    shortLabel: "المستخدمون",
    fill: "var(--color-appUsers)",
  },
  {
    key: "activeSubscriptions",
    label: "الاشتراكات النشطة",
    shortLabel: "الاشتراكات",
    fill: "var(--color-activeSubscriptions)",
  },
  {
    key: "deliveriesToday",
    label: "توصيلات اليوم",
    shortLabel: "التوصيلات",
    fill: "var(--color-deliveriesToday)",
  },
  {
    key: "pendingOrders",
    label: "الطلبات المعلقة",
    shortLabel: "المعلقة",
    fill: "var(--color-pendingOrders)",
  },
];

const statusFills = [
  "var(--color-status1)",
  "var(--color-status2)",
  "var(--color-status3)",
  "var(--color-status4)",
  "var(--color-status5)",
];

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeDate(value: unknown) {
  if (!value) return null;

  const raw = String(value);
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw.length >= 10 ? raw.slice(0, 10) : null;
  }

  return date.toISOString().slice(0, 10);
}

export function toMetricBarData(
  stats?: DashboardOverviewStats
): DashboardMetricRow[] {
  return metricMeta.map((item) => ({
    ...item,
    value: toNumber(stats?.[item.key]),
  }));
}

export function toRecentActivityTrend(
  data?: DashboardOverviewData
): DashboardTrendRow[] {
  const byDate = new Map<string, DashboardTrendRow>();

  data?.recentOrders?.forEach((order) => {
    const date = normalizeDate(order.date);
    if (!date) return;

    const row = byDate.get(date) ?? { date, orders: 0, subscriptions: 0 };
    row.orders += 1;
    byDate.set(date, row);
  });

  data?.recentSubscriptions?.forEach((subscription) => {
    const date = normalizeDate(subscription.createdAt ?? subscription.startDate);
    if (!date) return;

    const row = byDate.get(date) ?? { date, orders: 0, subscriptions: 0 };
    row.subscriptions += 1;
    byDate.set(date, row);
  });

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function toRecentOrderStatusData(
  data?: DashboardOverviewData
): DashboardStatusRow[] {
  const counts = new Map<string, number>();

  data?.recentOrders?.forEach((order) => {
    const status = order.status?.trim();
    if (!status) return;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([status, value], index) => ({
      status,
      value,
      fill: statusFills[index % statusFills.length],
    }));
}
