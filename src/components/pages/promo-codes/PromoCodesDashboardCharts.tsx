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
} satisfies ChartConfig;

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatNumber(value: number) {
  return value.toLocaleString("ar-SA");
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
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  if (rows.length <= limit) return rows;

  const visible = rows.slice(0, limit - 1);
  const other = rows.slice(limit - 1).reduce((sum, row) => sum + row.count, 0);
  return [...visible, { label: "أخرى", count: other }];
}

function buildUsageRows(promos: PromoCodeDTO[]) {
  return promos
    .map((promo) => {
      const used = getUsageCount(promo);
      const limit = promo.usageLimitTotal ?? null;
      const percent = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0;

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
    { label: promoCodeText.active, count: active },
    { label: "غير صالح الآن", count: notActive },
  ].filter((row) => row.count > 0);
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ChartLegendList({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
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
          <span className="truncate text-xs text-muted-foreground">
            {item.label}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatNumber(item.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActiveRateDonut({
  promos,
  data,
}: {
  promos: PromoCodeDTO[];
  data: Array<{ label: string; count: number }>;
}) {
  const total = promos.length;
  const active = promos.filter(
    (promo) => getPromoCodeStatus(promo.state) === "active"
  ).length;
  const activeRate = total ? Math.round((active / total) * 100) : 0;

  return (
    <div className="relative mx-auto h-[210px] w-full max-w-[260px]">
      {data.length ? (
        <>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius={62}
                outerRadius={86}
                paddingAngle={4}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.label}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-foreground">
              {formatNumber(activeRate)}%
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              صالح الآن
            </span>
          </div>
        </>
      ) : (
        <EmptyChart message="لا توجد أكواد لعرض النسبة." />
      )}
    </div>
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
  const totalUses = promos.reduce((sum, promo) => sum + getUsageCount(promo), 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]" dir="rtl">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-1 pb-2">
          <CardTitle className="text-base font-semibold">
            صحة أكواد الخصم
          </CardTitle>
          <CardDescription>
            توزيع الأكواد حسب صلاحيتها الحالية من حالة الباك اند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length ? (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
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
                  width={120}
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
            <EmptyChart message="لا توجد أكواد خصم لعرض الرسم." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">
              نسبة الأكواد الصالحة
            </CardTitle>
            <CardDescription>
              إجمالي الأكواد: {formatNumber(total)} — إجمالي الاستخدامات: {formatNumber(totalUses)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-1">
            <ActiveRateDonut promos={promos} data={activeRows} />
            <ChartLegendList data={activeRows} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">
              نوع الخصم
            </CardTitle>
            <CardDescription>
              مئوي أم مبلغ ثابت بالهللة حسب العقد.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-1">
            {discountTypeData.length ? (
              <ChartContainer config={chartConfig} className="mx-auto h-[170px] w-full max-w-[220px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={discountTypeData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {discountTypeData.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart message="لا توجد أنواع خصم للعرض." />
            )}
            <ChartLegendList data={discountTypeData} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm xl:col-span-2">
        <CardHeader className="gap-1 pb-2">
          <CardTitle className="text-base font-semibold">
            استخدام الأكواد ونطاق التطبيق
          </CardTitle>
          <CardDescription>
            أعلى الأكواد استخدامًا مع توزيع النطاق: اشتراك، خطط إضافات، أو الكل.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          {usageData.length ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                data={usageData}
                margin={{ top: 12, right: 12, left: 12, bottom: 6 }}
              >
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
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(label, payload) => {
                        const row = payload?.[0]?.payload as
                          | { name?: string; limit?: number | null }
                          | undefined;
                        const limitLabel = row?.limit
                          ? ` / ${formatNumber(row.limit)}`
                          : " / غير محدود";

                        return `${row?.name ?? label ?? "كود خصم"}${limitLabel}`;
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="used"
                  fill="var(--color-used)"
                  radius={[8, 8, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="لا توجد استخدامات أو حدود استخدام واضحة حتى الآن." />
          )}

          <div className="rounded-2xl border border-muted-foreground/10 bg-muted/20 p-4">
            <div className="mb-3">
              <h3 className="font-bold">نطاق الأكواد</h3>
              <p className="text-sm text-muted-foreground">
                يوضح أين يمكن استخدام الأكواد حسب قيمة appliesTo.
              </p>
            </div>
            {appliesToData.length ? (
              <div className="grid gap-4 md:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-1">
                <ChartContainer config={chartConfig} className="mx-auto h-[155px] w-full max-w-[200px]">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={appliesToData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={38}
                      outerRadius={64}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {appliesToData.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ChartLegendList data={appliesToData} />
              </div>
            ) : (
              <EmptyChart message="لا توجد نطاقات للعرض." />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}