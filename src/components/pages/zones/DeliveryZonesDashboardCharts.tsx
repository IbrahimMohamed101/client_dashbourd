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
import type { DeliveryZone } from "@/types/deliveryZoneTypes";

const chartConfig = {
  count: {
    label: "العدد",
    color: "var(--chart-1)",
  },
  fee: {
    label: "رسوم التوصيل",
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

function formatSAR(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function getZoneName(zone: DeliveryZone) {
  return zone.name.ar || zone.name.en || "منطقة بدون اسم";
}

function buildStatusRows(zones: DeliveryZone[]) {
  const active = zones.filter((zone) => zone.isActive).length;
  const inactive = Math.max(0, zones.length - active);

  return [
    { label: "نشطة", count: active },
    { label: "غير نشطة", count: inactive },
  ].filter((row) => row.count > 0);
}

function buildFeeRangeRows(zones: DeliveryZone[]) {
  const rows = [
    { label: "مجانية", count: 0, min: 0, max: 0 },
    { label: "حتى 15 ر.س", count: 0, min: 1, max: 1500 },
    { label: "15 - 30 ر.س", count: 0, min: 1501, max: 3000 },
    { label: "أكثر من 30 ر.س", count: 0, min: 3001, max: Number.POSITIVE_INFINITY },
  ];

  zones.forEach((zone) => {
    const fee = zone.deliveryFeeHalala;
    const match = rows.find((row) => fee >= row.min && fee <= row.max);
    if (match) match.count += 1;
  });

  return rows.filter((row) => row.count > 0).map(({ label, count }) => ({ label, count }));
}

function buildTopFeeRows(zones: DeliveryZone[]) {
  return [...zones]
    .sort((a, b) => b.deliveryFeeHalala - a.deliveryFeeHalala)
    .slice(0, 6)
    .map((zone) => ({
      label: getZoneName(zone),
      fee: zone.deliveryFeeHalala,
      formattedFee: formatSAR(zone.deliveryFeeHalala),
    }));
}

function buildSortRows(zones: DeliveryZone[]) {
  const sorted = [...zones]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 6);

  return sorted.map((zone) => ({
    label: getZoneName(zone),
    count: zone.sortOrder,
  }));
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
  zones,
  data,
}: {
  zones: DeliveryZone[];
  data: Array<{ label: string; count: number }>;
}) {
  const total = zones.length;
  const active = zones.filter((zone) => zone.isActive).length;
  const activeRate = total ? Math.round((active / total) * 100) : 0;

  return (
    <div className="relative mx-auto h-[210px] w-full max-w-[260px]">
      {data.length ? (
        <>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
              مناطق نشطة
            </span>
          </div>
        </>
      ) : (
        <EmptyChart message="لا توجد مناطق لعرض النسبة." />
      )}
    </div>
  );
}

export function DeliveryZonesDashboardCharts({
  zones,
}: {
  zones: DeliveryZone[];
}) {
  const statusData = buildStatusRows(zones);
  const feeRangeData = buildFeeRangeRows(zones);
  const topFeeData = buildTopFeeRows(zones);
  const sortData = buildSortRows(zones);
  const total = zones.length;
  const averageFee = total
    ? Math.round(
        zones.reduce((sum, zone) => sum + zone.deliveryFeeHalala, 0) / total
      )
    : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]" dir="rtl">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="gap-1 pb-2">
          <CardTitle className="text-base font-semibold">
            أعلى رسوم التوصيل
          </CardTitle>
          <CardDescription>
            مقارنة سريعة لأعلى المناطق تكلفة حسب القيمة المخزنة بالباك اند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topFeeData.length ? (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart
                data={topFeeData}
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
                  width={130}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => formatSAR(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="fee"
                  radius={[8, 8, 8, 8]}
                  fill="var(--color-fee)"
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="لا توجد مناطق توصيل لعرض الرسم." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">
              حالة المناطق
            </CardTitle>
            <CardDescription>
              إجمالي المناطق: {formatNumber(total)} — متوسط الرسوم: {formatSAR(averageFee)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-1">
            <ActiveRateDonut zones={zones} data={statusData} />
            <ChartLegendList data={statusData} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">
              شرائح رسوم التوصيل
            </CardTitle>
            <CardDescription>
              توزيع المناطق حسب نطاق تكلفة التوصيل.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-1">
            {feeRangeData.length ? (
              <ChartContainer config={chartConfig} className="mx-auto h-[170px] w-full max-w-[220px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={feeRangeData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {feeRangeData.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyChart message="لا توجد رسوم للعرض." />
            )}
            <ChartLegendList data={feeRangeData} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm xl:col-span-2">
        <CardHeader className="gap-1 pb-2">
          <CardTitle className="text-base font-semibold">
            ترتيب عرض المناطق
          </CardTitle>
          <CardDescription>
            أول المناطق في العرض حسب sortOrder. الترتيب الحقيقي يعود للباك اند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortData.length ? (
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={sortData} margin={{ top: 12, right: 12, left: 12, bottom: 6 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 12 }}
                />
                <YAxis hide allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[8, 8, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="لا توجد بيانات ترتيب للعرض." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}