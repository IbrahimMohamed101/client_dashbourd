import { useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BadgeDollarSignIcon,
  CalendarRangeIcon,
  CreditCardIcon,
  FilterIcon,
  Repeat2Icon,
  ShoppingCartIcon,
  TicketIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCOUNTING_RANGE_PRESETS,
  formatAccountingRangeLabel,
  resolveAccountingRangePreset,
  validateAccountingRange,
  type AccountingDateRange,
  type AccountingRangePresetId,
} from "@/features/accounting/accountingRange";
import {
  useMarketingAnalyticsQuery,
  type MarketingAnalyticsMetricComparison,
  type MarketingAnalyticsParams,
} from "@/features/accounting/marketingAnalytics";
import { getTodayKSADate } from "@/utils/ksaDate";

const PANEL_CLASS = "rounded-2xl bg-card/95 shadow-sm ring-1 ring-foreground/10";

type SegmentFilters = {
  promoCode: string;
  fulfillmentMethod: "all" | "delivery" | "pickup";
  paymentProvider: "all" | "moyasar" | "cash" | "manual";
  daysCount: string;
  grams: string;
  mealsPerDay: string;
};

const initialRange = resolveAccountingRangePreset("last30", getTodayKSADate());
const initialFilters: SegmentFilters = {
  promoCode: "",
  fulfillmentMethod: "all",
  paymentProvider: "all",
  daysCount: "all",
  grams: "all",
  mealsPerDay: "all",
};

function optionalNumber(value: string): number | null {
  if (!value || value === "all") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat("ar-SA").format(Number(value || 0));
}

function formatMoney(halala: number | null | undefined) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(halala || 0) / 100);
}

function formatPercent(value: number | null | undefined) {
  return `${new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 1,
  }).format(Number(value || 0))}%`;
}

function comparisonLabel(value?: MarketingAnalyticsMetricComparison) {
  if (!value) return null;
  if (value.changePercent === null) {
    return value.delta === 0 ? "بدون تغير" : "لا توجد قاعدة مقارنة";
  }
  const sign = value.changePercent > 0 ? "+" : "";
  return `${sign}${value.changePercent}% عن الفترة السابقة`;
}

export function MarketingAnalyticsReport() {
  const [draftRange, setDraftRange] = useState<AccountingDateRange>(initialRange);
  const [appliedRange, setAppliedRange] = useState<AccountingDateRange>(initialRange);
  const [filters, setFilters] = useState<SegmentFilters>(initialFilters);
  const [appliedPromo, setAppliedPromo] = useState("");
  const [comparePrevious, setComparePrevious] = useState(true);

  const rangeError = validateAccountingRange(draftRange);
  const hasPendingRange =
    draftRange.from !== appliedRange.from || draftRange.to !== appliedRange.to;

  const params = useMemo<MarketingAnalyticsParams>(
    () => ({
      from: appliedRange.from,
      to: appliedRange.to,
      comparePrevious,
      promoCode: appliedPromo,
      fulfillmentMethod: filters.fulfillmentMethod,
      paymentProvider: filters.paymentProvider,
      daysCount: optionalNumber(filters.daysCount),
      grams: optionalNumber(filters.grams),
      mealsPerDay: optionalNumber(filters.mealsPerDay),
    }),
    [
      appliedPromo,
      appliedRange,
      comparePrevious,
      filters.daysCount,
      filters.fulfillmentMethod,
      filters.grams,
      filters.mealsPerDay,
      filters.paymentProvider,
    ]
  );

  const query = useMarketingAnalyticsQuery(params);
  const report = query.data?.data;
  const metrics = report?.comparison?.metrics || {};

  const applyRange = () => {
    if (!rangeError) setAppliedRange(draftRange);
  };

  const applyPreset = (preset: AccountingRangePresetId) => {
    const next = resolveAccountingRangePreset(preset, getTodayKSADate());
    setDraftRange(next);
    setAppliedRange(next);
  };

  if (query.isError && !report) {
    const error = query.error as Error & { normalizedMessage?: string };
    return (
      <Card className={PANEL_CLASS}>
        <CardContent className="space-y-3 p-5">
          <p className="font-semibold">تعذر تحميل تحليلات التسويق.</p>
          <p className="text-sm text-muted-foreground">
            {error.normalizedMessage || error.message}
          </p>
          <Button type="button" onClick={() => void query.refetch()}>
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-5" aria-label="تحليلات التسويق" dir="rtl">
      <Card className={PANEL_CLASS}>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ActivityIcon className="size-5 text-primary" />
                مركز التسويق والتحويل
              </CardTitle>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                بيانات فعلية من MongoDB: التسجيل، بدء الدفع، الدفع المؤكد، العميل الجديد والمتكرر،
                الإيراد، البرومو والباقات. لا يتم تقدير تثبيتات التطبيق.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">قراءة فقط</Badge>
              <Badge variant="outline">توقيت الرياض</Badge>
              {query.isFetching ? <Badge variant="outline">جاري التحديث</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-4 lg:p-5">
          <div className="flex flex-wrap gap-2">
            {ACCOUNTING_RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={
                  appliedRange.from ===
                    resolveAccountingRangePreset(preset.id, getTodayKSADate()).from &&
                  appliedRange.to ===
                    resolveAccountingRangePreset(preset.id, getTodayKSADate()).to
                    ? "default"
                    : "outline"
                }
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="من تاريخ">
              <Input
                type="date"
                value={draftRange.from}
                onChange={(event) =>
                  setDraftRange((current) => ({ ...current, from: event.target.value }))
                }
              />
            </FilterField>
            <FilterField label="إلى تاريخ">
              <Input
                type="date"
                value={draftRange.to}
                onChange={(event) =>
                  setDraftRange((current) => ({ ...current, to: event.target.value }))
                }
              />
            </FilterField>
            <FilterField label="كود الخصم">
              <Input
                value={filters.promoCode}
                placeholder="الكل / KSA96"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    promoCode: event.target.value.toUpperCase(),
                  }))
                }
              />
            </FilterField>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                className="h-10 flex-1"
                disabled={Boolean(rangeError)}
                onClick={() => {
                  applyRange();
                  setAppliedPromo(filters.promoCode.trim().toUpperCase());
                }}
              >
                <FilterIcon className="size-4" />
                تطبيق
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  setFilters(initialFilters);
                  setAppliedPromo("");
                }}
              >
                مسح
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SelectField
              label="طريقة التنفيذ"
              value={filters.fulfillmentMethod}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  fulfillmentMethod: value as SegmentFilters["fulfillmentMethod"],
                }))
              }
              items={[
                ["all", "الكل"],
                ["delivery", "توصيل"],
                ["pickup", "استلام"],
              ]}
            />
            <SelectField
              label="مزود الدفع"
              value={filters.paymentProvider}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  paymentProvider: value as SegmentFilters["paymentProvider"],
                }))
              }
              items={[
                ["all", "الكل"],
                ["moyasar", "Moyasar"],
                ["cash", "نقدي"],
                ["manual", "يدوي / بطاقة"],
              ]}
            />
            <SelectField
              label="مدة الباقة"
              value={filters.daysCount}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, daysCount: value }))
              }
              items={[
                ["all", "الكل"],
                ["7", "7 أيام"],
                ["26", "26 يوم"],
                ["30", "30 يوم"],
              ]}
            />
            <SelectField
              label="الجرامات"
              value={filters.grams}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, grams: value }))
              }
              items={[
                ["all", "الكل"],
                ["100", "100 جم"],
                ["150", "150 جم"],
                ["200", "200 جم"],
              ]}
            />
            <SelectField
              label="وجبات / يوم"
              value={filters.mealsPerDay}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, mealsPerDay: value }))
              }
              items={[
                ["all", "الكل"],
                ["1", "1"],
                ["2", "2"],
                ["3", "3"],
                ["4", "4"],
                ["5", "5"],
              ]}
            />
          </div>

          <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p className={rangeError ? "text-destructive" : "text-muted-foreground"}>
              {rangeError ||
                (hasPendingRange
                  ? "عدّلت التاريخ. اضغط تطبيق لتحديث التقرير."
                  : formatAccountingRangeLabel(appliedRange))}
            </p>
            <Select
              value={comparePrevious ? "true" : "false"}
              onValueChange={(value) => setComparePrevious(value === "true")}
            >
              <SelectTrigger className="h-9 w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">مقارنة بالفترة السابقة</SelectItem>
                <SelectItem value="false">بدون مقارنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!report ? (
        <Card className={PANEL_CLASS}>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            جاري تحميل التقرير...
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<UserPlusIcon className="size-4" />}
              label="مسجلون جدد"
              value={formatInteger(report.kpis.registrations)}
              helper={comparisonLabel(metrics.registrations)}
            />
            <MetricCard
              icon={<UsersIcon className="size-4" />}
              label="سجلوا دخول"
              value={formatInteger(report.kpis.loggedInUsers)}
              helper={comparisonLabel(metrics.loggedInUsers)}
            />
            <MetricCard
              icon={<ShoppingCartIcon className="size-4" />}
              label="بدأوا Checkout"
              value={formatInteger(report.kpis.checkoutUsers)}
              helper={comparisonLabel(metrics.checkoutUsers)}
            />
            <MetricCard
              icon={<CreditCardIcon className="size-4" />}
              label="عملاء دفعوا"
              value={formatInteger(report.kpis.paidCustomers)}
              helper={comparisonLabel(metrics.paidCustomers)}
            />
            <MetricCard
              icon={<UserPlusIcon className="size-4" />}
              label="أول اشتراك"
              value={formatInteger(report.kpis.firstTimeSubscribers)}
              helper={comparisonLabel(metrics.firstTimeSubscribers)}
            />
            <MetricCard
              icon={<Repeat2Icon className="size-4" />}
              label="عملاء متكررون"
              value={formatInteger(report.kpis.repeatSubscribers)}
              helper={`نسبة التكرار ${formatPercent(report.kpis.repeatCustomerRate)}`}
            />
            <MetricCard
              icon={<BadgeDollarSignIcon className="size-4" />}
              label="إيراد التطبيق"
              value={formatMoney(report.kpis.appRevenueHalala)}
              helper={comparisonLabel(metrics.appRevenueHalala)}
            />
            <MetricCard
              icon={<BadgeDollarSignIcon className="size-4" />}
              label="متوسط العملية AOV"
              value={formatMoney(report.kpis.aovHalala)}
              helper={comparisonLabel(metrics.aovHalala)}
            />
          </div>

          <Card className={PANEL_CLASS}>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">قمع التحويل</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 md:grid-cols-4">
              <FunnelStep
                label="مسجلون"
                value={report.kpis.registrations}
                helper={`Register → Paid: ${formatPercent(report.kpis.registerToPaidRate)}`}
              />
              <FunnelStep
                label="بدأوا الدفع"
                value={report.kpis.checkoutUsers}
                helper={`${formatInteger(report.kpis.checkoutStarted)} Checkout`}
              />
              <FunnelStep
                label="دفعوا"
                value={report.kpis.paidCustomers}
                helper={`Checkout → Paid: ${formatPercent(report.kpis.checkoutToPaidRate)}`}
              />
              <FunnelStep
                label="أول اشتراك"
                value={report.kpis.firstTimeSubscribers}
                helper={`${formatInteger(report.kpis.repeatSubscribers)} متكرر`}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className={PANEL_CLASS}>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">جودة التحويل</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                <SmallStat label="Checkout غير مكتمل" value={report.kpis.abandonedCheckouts} />
                <SmallStat label="Checkout بانتظار الدفع" value={report.kpis.pendingCheckouts} />
                <SmallStat label="مدفوعات فاشلة" value={report.kpis.failedPayments} />
                <SmallStat label="إلغاءات الاشتراك" value={report.kpis.cancellations} />
              </CardContent>
            </Card>

            <Card className={PANEL_CLASS}>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">قنوات الإيراد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {report.sourceChannels.length ? (
                  report.sourceChannels.map((row) => (
                    <BreakdownRow
                      key={row.key}
                      label={row.labelAr || row.key}
                      count={row.count || 0}
                      value={row.amountHalala || 0}
                    />
                  ))
                ) : (
                  <EmptyLine />
                )}
                <div className="flex items-center justify-between border-t pt-3 font-semibold">
                  <span>إجمالي إيراد الاشتراكات</span>
                  <span>{formatMoney(report.kpis.totalSubscriptionRevenueHalala)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={PANEL_CLASS}>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TicketIcon className="size-5 text-primary" />
                أداء أكواد الخصم
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b bg-muted/25 text-muted-foreground">
                  <tr>
                    <TableHead>الكود</TableHead>
                    <TableHead>المحاولات</TableHead>
                    <TableHead>مدفوع</TableHead>
                    <TableHead>التحويل</TableHead>
                    <TableHead>الإيراد</TableHead>
                    <TableHead>الخصم</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {report.promoPerformance.length ? (
                    report.promoPerformance.map((row) => (
                      <tr key={row.code} className="border-b last:border-0">
                        <TableCell className="font-semibold">{row.code}</TableCell>
                        <TableCell>{formatInteger(row.attempts)}</TableCell>
                        <TableCell>{formatInteger(row.paidCount)}</TableCell>
                        <TableCell>{formatPercent(row.conversionRate)}</TableCell>
                        <TableCell>{formatMoney(row.revenueHalala)}</TableCell>
                        <TableCell>{formatMoney(row.discountHalala)}</TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <TableCell colSpan={6}>
                        <span className="text-muted-foreground">لا توجد استخدامات برومو في الفترة.</span>
                      </TableCell>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className={PANEL_CLASS}>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">أداء الباقات المدفوعة من التطبيق</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b bg-muted/25 text-muted-foreground">
                  <tr>
                    <TableHead>الباقة</TableHead>
                    <TableHead>الجرامات</TableHead>
                    <TableHead>وجبات/يوم</TableHead>
                    <TableHead>عمليات مدفوعة</TableHead>
                    <TableHead>عملاء</TableHead>
                    <TableHead>الإيراد</TableHead>
                    <TableHead>الخصومات</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {report.planPerformance.length ? (
                    report.planPerformance.map((row) => (
                      <tr
                        key={`${row.daysCount}-${row.grams}-${row.mealsPerDay}`}
                        className="border-b last:border-0"
                      >
                        <TableCell>{formatInteger(row.daysCount)} يوم</TableCell>
                        <TableCell>{formatInteger(row.grams)} جم</TableCell>
                        <TableCell>{formatInteger(row.mealsPerDay)}</TableCell>
                        <TableCell>{formatInteger(row.paidTransactions)}</TableCell>
                        <TableCell>{formatInteger(row.customersCount)}</TableCell>
                        <TableCell>{formatMoney(row.revenueHalala)}</TableCell>
                        <TableCell>{formatMoney(row.discountHalala)}</TableCell>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <TableCell colSpan={7}>
                        <span className="text-muted-foreground">لا توجد مبيعات مطابقة للفلاتر.</span>
                      </TableCell>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <CompactBreakdown
              title="طريقة التنفيذ"
              rows={report.fulfillmentPerformance}
            />
            <CompactBreakdown
              title="مزود الدفع"
              rows={report.paymentProviders}
            />
          </div>

          <Card className={PANEL_CLASS}>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarRangeIcon className="size-5 text-primary" />
                الحركة اليومية
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[520px] overflow-auto p-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 border-b bg-card text-muted-foreground">
                  <tr>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>تسجيلات</TableHead>
                    <TableHead>Checkout</TableHead>
                    <TableHead>مدفوع</TableHead>
                    <TableHead>إيراد التطبيق</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {report.daily.map((row) => (
                    <tr key={row.date} className="border-b last:border-0">
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell>{formatInteger(row.registrations)}</TableCell>
                      <TableCell>{formatInteger(row.checkouts)}</TableCell>
                      <TableCell>{formatInteger(row.paidTransactions)}</TableCell>
                      <TableCell>{formatMoney(row.revenueHalala)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className={PANEL_CLASS}>
            <CardContent className="space-y-2 p-4 text-xs leading-6 text-muted-foreground">
              {report.notes.map((note) => (
                <p key={note}>• {note}</p>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Array<[string, string]>;
}) {
  return (
    <FilterField label={label}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([key, text]) => (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string | null;
}) {
  const comparisonPositive = helper?.startsWith("+");
  const comparisonNegative = helper?.startsWith("-");
  return (
    <Card className={PANEL_CLASS}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </div>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        {helper ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {comparisonPositive ? <ArrowUpIcon className="size-3" /> : null}
            {comparisonNegative ? <ArrowDownIcon className="size-3" /> : null}
            {helper}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FunnelStep({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{formatInteger(value)}</p>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/10 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{formatInteger(value)}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  count,
  value,
}: {
  label: string;
  count: number;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{formatInteger(count)} عملية</p>
      </div>
      <p className="font-semibold">{formatMoney(value)}</p>
    </div>
  );
}

function CompactBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    key: string;
    labelAr?: string;
    paidTransactions?: number;
    revenueHalala?: number;
  }>;
}) {
  return (
    <Card className={PANEL_CLASS}>
      <CardHeader className="border-b">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {rows.length ? (
          rows.map((row) => (
            <BreakdownRow
              key={row.key}
              label={row.labelAr || row.key}
              count={row.paidTransactions || 0}
              value={row.revenueHalala || 0}
            />
          ))
        ) : (
          <EmptyLine />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyLine() {
  return (
    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
      لا توجد بيانات مطابقة للفترة والفلاتر.
    </p>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-right font-medium">{children}</th>;
}

function TableCell({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-4 py-3 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
