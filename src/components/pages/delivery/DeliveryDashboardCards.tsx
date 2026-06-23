import {
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isOneTimeOrder } from "@/types/dashboardOpsTypes";

interface DeliveryDashboardCardsProps {
  data: UnifiedQueueItem[];
  isLoading: boolean;
}

const chartConfig = {
  count: {
    label: "العدد",
    color: "var(--chart-1)",
  },
  status1: { label: "حالة 1", color: "var(--chart-1)" },
  status2: { label: "حالة 2", color: "var(--chart-2)" },
  status3: { label: "حالة 3", color: "var(--chart-3)" },
  status4: { label: "حالة 4", color: "var(--chart-4)" },
  status5: { label: "حالة 5", color: "var(--chart-5)" },
} satisfies ChartConfig;

const PIE_COLORS = [
  "var(--color-status1)",
  "var(--color-status2)",
  "var(--color-status3)",
  "var(--color-status4)",
  "var(--color-status5)",
];

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

function getStatusLabel(item: UnifiedQueueItem) {
  return item.statusLabel || item.ui?.label || item.status || "غير محدد";
}

function getDeliveryWindow(item: UnifiedQueueItem) {
  return item.context.window || item.delivery?.window || item.delivery?.deliveryWindow || "غير محدد";
}

function getSourceLabel(item: UnifiedQueueItem) {
  return isOneTimeOrder(item) ? "طلب فردي" : "اشتراك";
}

function aggregateByLabel<T>(items: T[], getLabel: (item: T) => string, limit = 5) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const label = getLabel(item) || "غير محدد";
    map.set(label, (map.get(label) ?? 0) + 1);
  });

  const rows = Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  if (rows.length <= limit) return rows;
  const visible = rows.slice(0, limit - 1);
  const other = rows.slice(limit - 1).reduce((sum, row) => sum + row.count, 0);
  return [...visible, { label: "أخرى", count: other }];
}

function buildActionRows(data: UnifiedQueueItem[]) {
  const needsAction = data.filter((item) => item.allowedActions?.length).length;
  const noAction = Math.max(0, data.length - needsAction);

  return [
    { label: "يحتاج إجراء", count: needsAction },
    { label: "بدون إجراء", count: noAction },
  ].filter((row) => row.count > 0);
}

function LoadingCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <Card className="rounded-2xl">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[170px] w-full" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[170px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function LegendList({ data }: { data: Array<{ label: string; count: number }> }) {
  return (
    <div className="grid gap-2">
      {data.map((item, index) => (
        <div
          key={item.label}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
        >
          <span
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
          />
          <span className="truncate text-xs text-muted-foreground">{item.label}</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatNumber(item.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DeliveryDashboardCards({
  data,
  isLoading,
}: DeliveryDashboardCardsProps) {
  if (isLoading) return <LoadingCharts />;

  const statusData = aggregateByLabel(data, getStatusLabel, 6);
  const windowData = aggregateByLabel(data, getDeliveryWindow, 5);
  const actionData = buildActionRows(data);
  const sourceData = aggregateByLabel(data, getSourceLabel, 3);
  const total = data.length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-1 pb-2">
          <CardTitle className="text-base font-semibold">حالة توصيلات اليوم</CardTitle>
          <CardDescription>
            توزيع واضح لحالة الطلبات بدلا من كروت أرقام كثيرة. الإجمالي: {formatNumber(total)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length ? (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={98}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 8, 8]}
                  fill="var(--color-count)"
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="لا توجد حالات توصيل للعرض حتى الآن." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">نوافذ التوصيل</CardTitle>
            <CardDescription>يساعد الكابتن يعرف ضغط كل وقت بسرعة.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-1">
            {windowData.length ? (
              <ChartContainer config={chartConfig} className="mx-auto h-[170px] w-full max-w-[220px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={windowData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {windowData.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart message="لا توجد نوافذ توصيل." />
            )}
            <LegendList data={windowData} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">الإجراءات ونوع الطلب</CardTitle>
            <CardDescription>مختصر لما يحتاج تدخل الآن.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionData.length ? (
              <ChartContainer config={chartConfig} className="h-[150px] w-full">
                <BarChart data={actionData} margin={{ top: 12, right: 12, left: 12, bottom: 6 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis hide allowDecimals={false} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={[8, 8, 0, 0]}
                    barSize={42}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart message="لا توجد إجراءات." />
            )}
            <LegendList data={sourceData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
