import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
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

type CountRow = {
  label: string;
  count: number;
};

const chartConfig = {
  count: {
    label: "العدد",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

function getStatusLabel(item: UnifiedQueueItem) {
  return item.statusLabel || item.ui?.label || item.status || "غير محدد";
}

function getDeliveryWindow(item: UnifiedQueueItem) {
  return (
    item.context.window ||
    item.delivery?.window ||
    item.delivery?.deliveryWindow ||
    "غير محدد"
  );
}

function getSourceLabel(item: UnifiedQueueItem) {
  return isOneTimeOrder(item) ? "طلب فردي" : "اشتراك";
}

function aggregateByLabel<T>(
  items: T[],
  getLabel: (item: T) => string,
  limit = 5
) {
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
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <Card className="rounded-2xl py-4">
        <CardHeader className="px-4 pb-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="px-4">
          <Skeleton className="h-44 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="rounded-2xl py-4">
            <CardHeader className="px-4 pb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent className="px-4">
              <Skeleton className="h-28 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function LegendList({ data }: { data: CountRow[] }) {
  return (
    <div className="grid gap-1.5">
      {data.map((item, index) => (
        <div
          key={item.label}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
        >
          <span
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
          />
          <span className="truncate text-xs font-medium text-muted-foreground">
            {item.label}
          </span>
          <span className="text-sm font-black tabular-nums">
            {formatNumber(item.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-muted-foreground/10 bg-background/70 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-black tabular-nums">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function StatusChart({ rows }: { rows: CountRow[] }) {
  if (!rows.length) {
    return <EmptyChart message="لا توجد حالات توصيل للعرض حتى الآن." />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-44 w-full">
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
        barCategoryGap={10}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis dataKey="label" type="category" hide width={0} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" labelKey="label" />}
        />
        <Bar
          dataKey="count"
          radius={[8, 8, 8, 8]}
          fill="var(--color-count)"
          barSize={18}
        />
      </BarChart>
    </ChartContainer>
  );
}

function WindowDonut({ rows }: { rows: CountRow[] }) {
  if (!rows.length) {
    return <EmptyChart message="لا توجد نوافذ توصيل." />;
  }

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto h-28 w-full max-w-[150px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="label" />}
        />
        <Pie
          data={rows}
          dataKey="count"
          nameKey="label"
          innerRadius={34}
          outerRadius={48}
          paddingAngle={3}
          strokeWidth={0}
        >
          <Label
            position="center"
            content={() => (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-sm font-bold"
              >
                {formatNumber(total)}
              </text>
            )}
          />
          {rows.map((entry, index) => (
            <Cell
              key={entry.label}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

function ActionChart({ rows }: { rows: CountRow[] }) {
  if (!rows.length) {
    return <EmptyChart message="لا توجد إجراءات." />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-32 w-full">
      <BarChart
        data={rows}
        margin={{ top: 10, right: 12, left: 12, bottom: 4 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" hide />
        <YAxis hide allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" labelKey="label" />}
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          radius={[8, 8, 0, 0]}
          barSize={36}
        />
      </BarChart>
    </ChartContainer>
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
  const needsAction = data.filter((item) => item.allowedActions?.length).length;
  const inTransit = data.filter(
    (item) => item.status === "out_for_delivery"
  ).length;

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <Card className="rounded-2xl py-4 shadow-sm">
        <CardHeader className="px-4 pb-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base font-black">
                حالة توصيلات اليوم
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                توزيع سريع للحالات. أسماء الحالات تظهر في القائمة الجانبية حتى
                لا تختفي داخل الرسم.
              </CardDescription>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:min-w-[20rem]">
              <SummaryPill label="الإجمالي" value={total} />
              <SummaryPill label="في الطريق" value={inTransit} />
              <SummaryPill label="تحتاج إجراء" value={needsAction} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <StatusChart rows={statusData} />
          <LegendList data={statusData} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="rounded-2xl py-4 shadow-sm">
          <CardHeader className="px-4 pb-1">
            <CardTitle className="text-base font-black">
              نوافذ التوصيل
            </CardTitle>
            <CardDescription className="text-xs">
              ضغط كل وقت ظاهر بالقائمة بجانب الرسم.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-4 md:grid-cols-[9rem_minmax(0,1fr)] xl:grid-cols-[9rem_minmax(0,1fr)]">
            <WindowDonut rows={windowData} />
            <LegendList data={windowData} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl py-4 shadow-sm">
          <CardHeader className="px-4 pb-1">
            <CardTitle className="text-base font-black">
              الإجراءات ونوع الطلب
            </CardTitle>
            <CardDescription className="text-xs">
              مختصر لما يحتاج تدخل الآن.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem] xl:grid-cols-1">
              <ActionChart rows={actionData} />
              <LegendList data={actionData} />
            </div>
            <LegendList data={sourceData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
