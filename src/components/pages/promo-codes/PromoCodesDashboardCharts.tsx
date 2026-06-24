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
import type { PromoCodeDTO } from "@/types/financeTypes";
import {
  formatAppliesTo,
  getPromoCodeName,
  getPromoCodeStatus,
  promoCodeText,
} from "./promo-codes-columns";

const chartConfig = {
  count: {
    label: "العدد",
    color: "var(--chart-1)",
  },
  used: {
    label: "الاستخدامات",
    color: "var(--chart-2)",
  },
  limit: {
    label: "الحد",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type CountRow = {
  label: string;
  count: number;
  fill?: string;
};

type UsageRow = {
  label: string;
  name: string;
  used: number;
  limit: number | null;
  percent: number;
};

function formatNumber(value: number) {
  return value.toLocaleString("ar-SA");
}

function formatPercent(value: number) {
  return `${formatNumber(value)}%`;
}

function getUsageCount(promo: PromoCodeDTO) {
  return promo.currentUsageCount ?? promo.usedCount ?? 0;
}

function getStatusLabel(promo: PromoCodeDTO) {
  const status = getPromoCodeStatus(promo.state);
  return promoCodeText[status];
}

function getDiscountTypeLabel(promo: PromoCodeDTO) {
  return promo.discountType === "percentage"
    ? promoCodeText.percentage
    : promoCodeText.fixed;
}

function aggregateByLabel<T>(
  items: T[],
  getLabel: (item: T) => string,
  limit = 6
) {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const label = getLabel(item) || promoCodeText.notSpecified;
    map.set(label, (map.get(label) ?? 0) + 1);
  });

  const rows = Array.from(map.entries())
    .map(([label, count], index) => ({
      label,
      count,
      fill: PIE_COLORS[index % PIE_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);

  if (rows.length <= limit) return rows;

  const visible = rows.slice(0, limit - 1);
  const other = rows.slice(limit - 1).reduce((sum, row) => sum + row.count, 0);

  return [
    ...visible,
    {
      label: "أخرى",
      count: other,
      fill: PIE_COLORS[(limit - 1) % PIE_COLORS.length],
    },
  ];
}

function buildUsageRows(promos: PromoCodeDTO[]) {
  return promos
    .map((promo) => {
      const used = getUsageCount(promo);
      const limit = promo.usageLimitTotal ?? null;
      const percent = limit
        ? Math.min(Math.round((used / limit) * 100), 100)
        : 0;

      return {
        label: promo.code,
        name: getPromoCodeName(promo) || promo.code,
        used,
        limit,
        percent,
      };
    })
    .filter((row) => row.used > 0 || row.limit)
    .sort((a, b) => {
      if (b.used !== a.used) return b.used - a.used;
      return b.percent - a.percent;
    })
    .slice(0, 6);
}

function buildActiveRows(promos: PromoCodeDTO[]) {
  const active = promos.filter(
    (promo) => getPromoCodeStatus(promo.state) === "active"
  ).length;
  const notActive = Math.max(0, promos.length - active);

  return [
    { label: promoCodeText.active, count: active, fill: PIE_COLORS[0] },
    { label: "غير صالح الآن", count: notActive, fill: PIE_COLORS[3] },
  ].filter((row) => row.count > 0);
}

function EmptyChart({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-36 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center text-sm text-muted-foreground ${className}`}
    >
      {message}
    </div>
  );
}

function MiniLegend({
  data,
  dense = false,
}: {
  data: CountRow[];
  dense?: boolean;
}) {
  return (
    <div className={dense ? "grid gap-1.5" : "grid gap-2"}>
      {data.map((item, index) => (
        <div
          key={item.label}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-muted/35 px-3 py-2"
        >
          <span
            className="size-2.5 rounded-[3px]"
            style={{
              backgroundColor:
                item.fill ?? PIE_COLORS[index % PIE_COLORS.length],
            }}
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

function UsageLegend({ data }: { data: UsageRow[] }) {
  if (!data.length) return null;

  return (
    <div className="grid gap-1.5">
      {data.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-muted/35 px-3 py-2"
        >
          <div className="min-w-0">
            <p
              className="truncate font-mono text-xs font-black uppercase"
              dir="ltr"
            >
              {item.label}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {item.name}
            </p>
          </div>
          <div className="text-left text-xs font-black tabular-nums" dir="ltr">
            {formatNumber(item.used)}
            <span className="mx-1 text-muted-foreground">/</span>
            {item.limit ? formatNumber(item.limit) : "∞"}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-muted-foreground/10 bg-background/70 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-black tabular-nums">{value}</p>
    </div>
  );
}

function StatusBars({ data }: { data: CountRow[] }) {
  if (!data.length) {
    return (
      <EmptyChart message="لا توجد أكواد خصم لعرض الرسم." className="h-40" />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          hide
          allowDecimals={false}
          tickFormatter={(value) => formatNumber(Number(value))}
        />
        <YAxis dataKey="label" type="category" hide width={0} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" labelKey="label" />}
        />
        <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={20}>
          {data.map((entry, index) => (
            <Cell
              key={entry.label}
              fill={entry.fill ?? PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

function DonutChart({
  data,
  centerValue,
  centerLabel,
  emptyMessage,
  height = "h-28",
}: {
  data: CountRow[];
  centerValue: string;
  centerLabel: string;
  emptyMessage: string;
  height?: string;
}) {
  if (!data.length) {
    return <EmptyChart message={emptyMessage} className={height} />;
  }

  return (
    <div className={`relative mx-auto w-full max-w-[150px] ${height}`}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="label" />}
          />
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={34}
            outerRadius={48}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={entry.fill ?? PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black text-foreground">
          {centerValue}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

function UsageBars({ data }: { data: UsageRow[] }) {
  if (!data.length) {
    return (
      <EmptyChart
        message="لا توجد استخدامات أو حدود استخدام واضحة حتى الآن."
        className="h-40"
      />
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis dataKey="label" type="category" hide width={0} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label, payload) => {
                const row = payload?.[0]?.payload as UsageRow | undefined;
                const limitLabel = row?.limit
                  ? `الحد: ${formatNumber(row.limit)}`
                  : "بدون حد استخدام";

                return `${row?.name ?? label} - ${limitLabel}`;
              }}
            />
          }
        />
        <Bar
          dataKey="used"
          radius={[8, 8, 8, 8]}
          fill="var(--color-used)"
          barSize={20}
        ></Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function PromoCodesDashboardCharts({
  promos,
}: {
  promos: PromoCodeDTO[];
}) {
  const total = promos.length;
  const statusData = aggregateByLabel(promos, getStatusLabel, 5);
  const discountTypeData = aggregateByLabel(promos, getDiscountTypeLabel, 3);
  const appliesToData = aggregateByLabel(
    promos,
    (promo) => formatAppliesTo(promo.appliesTo),
    4
  );
  const usageData = buildUsageRows(promos);
  const activeRows = buildActiveRows(promos);
  const totalUses = promos.reduce(
    (sum, promo) => sum + getUsageCount(promo),
    0
  );
  const activeCount =
    activeRows.find((row) => row.label === promoCodeText.active)?.count ?? 0;
  const activeRate = total ? Math.round((activeCount / total) * 100) : 0;
  const usageWithLimits = promos.filter(
    (promo) => promo.usageLimitTotal
  ).length;

  return (
    <div
      className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"
      dir="rtl"
    >
      <Card className="rounded-xl py-3 shadow-sm">
        <CardHeader className="px-4 pb-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base font-black">
                صحة أكواد الخصم
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                توزيع الحالة الحالية من بيانات الخادم، مع العدد ظاهر على كل
                شريط.
              </CardDescription>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:min-w-[20rem]">
              <SummaryPill label="إجمالي الأكواد" value={formatNumber(total)} />
              <SummaryPill label="النشطة" value={formatNumber(activeCount)} />
              <SummaryPill
                label="الاستخدامات"
                value={formatNumber(totalUses)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
          <StatusBars data={statusData} />
          <MiniLegend data={statusData} dense />
        </CardContent>
      </Card>

      <Card className="rounded-xl py-3 shadow-sm">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-base font-black">النسبة والنوع</CardTitle>
          <CardDescription className="text-xs">
            ملخص سريع للصلاحية ونوع الخصم بدون إخفاء الأرقام داخل الرسم.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[10rem_minmax(0,1fr)]">
            <DonutChart
              data={activeRows}
              centerValue={formatPercent(activeRate)}
              centerLabel="صالح الآن"
              emptyMessage="لا توجد أكواد لعرض النسبة."
            />
            <MiniLegend data={activeRows} dense />
          </div>
          <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[10rem_minmax(0,1fr)]">
            <DonutChart
              data={discountTypeData}
              centerValue={formatNumber(discountTypeData.length)}
              centerLabel="أنواع"
              emptyMessage="لا توجد أنواع خصم للعرض."
            />
            <MiniLegend data={discountTypeData} dense />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl py-3 shadow-sm xl:col-span-2">
        <CardHeader className="px-4 pb-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base font-black">
                الاستخدام ونطاق التطبيق
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                أكثر الأكواد استخداما، وما إذا كان الكود للاشتراك أو الإضافات أو
                الكل.
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:min-w-[16rem]">
              <SummaryPill
                label="أكواد لها حد"
                value={formatNumber(usageWithLimits)}
              />
              <SummaryPill
                label="نطاقات ظاهرة"
                value={formatNumber(appliesToData.length)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <UsageBars data={usageData} />
            <UsageLegend data={usageData} />
          </div>

          <div className="grid gap-3 rounded-xl border border-muted-foreground/10 bg-muted/20 p-3 sm:grid-cols-[9rem_minmax(0,1fr)] xl:grid-cols-[9rem_minmax(0,1fr)]">
            <DonutChart
              data={appliesToData}
              centerValue={formatNumber(appliesToData.length)}
              centerLabel="نطاق"
              emptyMessage="لا توجد نطاقات للعرض."
            />
            <MiniLegend data={appliesToData} dense />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
