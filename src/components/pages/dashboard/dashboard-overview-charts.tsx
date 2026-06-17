import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardOverviewData } from "@/types/dashboardHomeTypes";
import {
  toMetricBarData,
  toRecentActivityTrend,
  toRecentOrderStatusData,
  type DashboardMetricRow,
  type DashboardStatusRow,
} from "./dashboardDataAdapter";

const chartConfig = {
  orders: {
    label: "الطلبات",
    color: "var(--chart-2)",
  },
  subscriptions: {
    label: "الاشتراكات",
    color: "var(--chart-1)",
  },
  appUsers: {
    label: "مستخدمو التطبيق",
    color: "var(--chart-1)",
  },
  activeSubscriptions: {
    label: "الاشتراكات النشطة",
    color: "var(--chart-2)",
  },
  deliveriesToday: {
    label: "توصيلات اليوم",
    color: "var(--chart-3)",
  },
  pendingOrders: {
    label: "الطلبات المعلقة",
    color: "var(--chart-4)",
  },
  status1: {
    label: "حالة 1",
    color: "var(--chart-1)",
  },
  status2: {
    label: "حالة 2",
    color: "var(--chart-2)",
  },
  status3: {
    label: "حالة 3",
    color: "var(--chart-3)",
  },
  status4: {
    label: "حالة 4",
    color: "var(--chart-4)",
  },
  status5: {
    label: "حالة 5",
    color: "var(--chart-5)",
  },
  value: {
    label: "القيمة",
  },
} satisfies ChartConfig;

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  });
}

function DashboardEmptyChartState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center">
      <div className="mb-3 size-2 rounded-full bg-primary/60" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function MetricLegend({ data }: { data: DashboardMetricRow[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" dir="rtl">
      {data.map((item) => (
        <div
          key={item.key}
          className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted/35 px-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: item.fill }}
            />
            <span className="truncate text-sm text-muted-foreground">
              {item.label}
            </span>
          </span>
          <span className="font-medium tabular-nums">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusLegend({ data }: { data: DashboardStatusRow[] }) {
  return (
    <div className="grid gap-2" dir="rtl">
      {data.map((item) => (
        <div
          key={item.status}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
        >
          <span
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: item.fill }}
          />
          <span className="truncate text-sm text-muted-foreground">
            {item.status}
          </span>
          <span className="text-sm font-medium tabular-nums">
            {formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardActivityAreaChart({ data }: { data?: DashboardOverviewData }) {
  const trendRows = React.useMemo(() => toRecentActivityTrend(data), [data]);
  const hasTrend = trendRows.length > 0;

  return (
    <Card className="rounded-lg lg:col-span-8">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-base font-semibold">
          نشاط المنصة
        </CardTitle>
        <CardDescription>
          اتجاه مبني على سجلات النشاط الأخيرة المحملة من الخادم، وليس تحليلا تاريخيا كاملا.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasTrend ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={trendRows} margin={{ top: 16, right: 12 }}>
              <defs>
                <linearGradient id="dashboardOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.32}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.03}
                  />
                </linearGradient>
                <linearGradient
                  id="dashboardSubscriptions"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-subscriptions)"
                    stopOpacity={0.26}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-subscriptions)"
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={28}
                tickFormatter={formatDateLabel}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
                tickFormatter={formatNumber}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => formatDateLabel(String(value))}
                  />
                }
              />
              <Area
                dataKey="orders"
                type="monotone"
                fill="url(#dashboardOrders)"
                stroke="var(--color-orders)"
                strokeWidth={2}
              />
              <Area
                dataKey="subscriptions"
                type="monotone"
                fill="url(#dashboardSubscriptions)"
                stroke="var(--color-subscriptions)"
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <DashboardEmptyChartState
            title="لا توجد بيانات اتجاهات كافية"
            description="يحتاج الرسم الزمني إلى بيانات يومية من الخادم لعرض الاتجاه بدقة."
          />
        )}
      </CardContent>
    </Card>
  );
}

function DashboardMetricBarChart({ data }: { data?: DashboardOverviewData }) {
  const metricRows = React.useMemo(
    () => toMetricBarData(data?.stats),
    [data?.stats]
  );
  const hasData = metricRows.some((item) => item.value > 0);

  return (
    <Card className="rounded-lg lg:col-span-12">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-base font-semibold">
          ملخص الأرقام الرئيسية
        </CardTitle>
        <CardDescription>
          مقارنة مباشرة لقيم الملخص الحالية كما يرجعها الخادم.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid gap-4">
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={metricRows} margin={{ top: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                  tickFormatter={formatNumber}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={<ChartTooltipContent hideLabel nameKey="key" />}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {metricRows.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <MetricLegend data={metricRows} />
          </div>
        ) : (
          <DashboardEmptyChartState
            title="لا توجد أرقام كافية"
            description="سيظهر ملخص الأرقام عندما يرجع الخادم قيما أكبر من صفر."
          />
        )}
      </CardContent>
    </Card>
  );
}

function DashboardStatusDistributionChart({
  data,
}: {
  data?: DashboardOverviewData;
}) {
  const statusRows = React.useMemo(() => toRecentOrderStatusData(data), [data]);
  const hasData = statusRows.length > 0;

  return (
    <Card className="rounded-lg lg:col-span-4">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-base font-semibold">
          توزيع الحالات
        </CardTitle>
        <CardDescription>
          حالات الطلبات ضمن آخر سجلات محملة فقط.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid gap-4">
            <ChartContainer config={chartConfig} className="h-[230px] w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="status" />}
                />
                <Pie
                  data={statusRows}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={2}
                >
                  {statusRows.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <StatusLegend data={statusRows} />
          </div>
        ) : (
          <DashboardEmptyChartState
            title="لا توجد حالات كافية"
            description="لا توجد حالات طلبات حديثة كافية لعرض توزيع موثوق."
          />
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardOverviewCharts({
  data,
}: {
  data?: DashboardOverviewData;
}) {
  return (
    <section className="grid gap-4 px-4 lg:grid-cols-12 lg:px-6" dir="rtl">
      <DashboardActivityAreaChart data={data} />
      <DashboardStatusDistributionChart data={data} />
      <DashboardMetricBarChart data={data} />
    </section>
  );
}
