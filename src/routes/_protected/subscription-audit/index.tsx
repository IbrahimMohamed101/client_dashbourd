import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  CalendarRangeIcon,
  DownloadIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAccountingDays } from "@/features/accounting/accountingRange";
import api from "@/lib/apis";
import { getTodayKSADate } from "@/utils/ksaDate";

export const Route = createFileRoute("/_protected/subscription-audit/")({
  component: SubscriptionAuditPage,
});

type Risk = "critical" | "high" | "medium" | "low" | "ok";
type FulfillmentFilter = "all" | "delivery" | "pickup";
type RiskFilter = "all" | Risk;

interface AuditIssue {
  code: string;
  severity: Risk;
  message: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

interface Plan {
  id: string;
  name: string;
  daysCount: number;
  mealsPerDay: number;
}

interface SourceInfo {
  code: "branch" | "app" | "unknown";
  labelAr: string;
  contractSource?: string | null;
  payment?: {
    provider?: string | null;
    method?: string | null;
    source?: string | null;
    status?: string | null;
    amountHalala?: number | null;
    paidAt?: string | null;
  } | null;
}

interface DayAudit {
  date: string;
  dateState: "past" | "today" | "future";
  expectedMeals: number;
  selectedMeals: number;
  fulfilled: boolean;
  nonConsuming: boolean;
  deductedMealsObserved: number;
  risk: Risk;
  day?: { status?: string | null; plannerState?: string | null } | null;
  delivery?: { status?: string | null; deliveredAt?: string | null } | null;
  pickupRequests: Array<{
    status?: string | null;
    mealCount: number;
    reservationState?: string | null;
  }>;
  allocation: {
    reserved: number;
    consumed: number;
    released: number;
    forfeited: number;
    duplicateKeys: number;
  };
  manualDeduction: {
    count: number;
    totalMeals: number;
    records: Array<{
      id: string;
      totalMeals: number;
      regularMeals: number;
      premiumMeals: number;
      reason?: string | null;
      notes?: string | null;
      actorRole?: string | null;
      createdAt?: string | null;
    }>;
  };
  issues: AuditIssue[];
}

interface SubscriptionAudit {
  subscriptionId: string;
  customer: Customer;
  plan: Plan;
  source: SourceInfo;
  fulfillmentMethod: "delivery" | "pickup" | string;
  fulfillmentLabelAr: string;
  status?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  risk: Risk;
  balance: {
    totalMeals: number;
    availableMeals: number;
    displayedUnconsumedMeals: number;
    reservedMeals: number;
    consumedMeals: number;
    forfeitedMeals: number;
    equationDifference: number;
    balanced: boolean;
    unattributedAggregateConsumption: number;
  };
  periodSummary: {
    reviewedDays: number;
    fulfilledDays: number;
    automaticConsumedMeals: number;
    reservedMeals: number;
    manualDeductedMeals: number;
    criticalDays: number;
    highRiskDays: number;
  };
  issues: AuditIssue[];
  days: DayAudit[];
}

interface NewSubscription {
  subscriptionId: string;
  customer: Customer;
  plan: Plan;
  source: SourceInfo;
  fulfillmentMethod: "delivery" | "pickup" | string;
  fulfillmentLabelAr: string;
  channelKey: string;
  status?: string | null;
  createdAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalMeals: number;
  totalPriceHalala: number;
  auditRisk: Risk;
}

interface AuditReport {
  generatedAt: string;
  range: {
    from: string;
    to: string;
    days: number;
    timezone: string;
    today?: string;
  };
  summary: {
    newSubscriptions: {
      total: number;
      pickup: number;
      delivery: number;
      fromBranch: number;
      fromApp: number;
      matrix: Record<string, number>;
    };
    operations: {
      reviewedSubscriptions: number;
      deliverySubscriptions: number;
      pickupSubscriptions: number;
      reviewedDays: number;
      automaticConsumedMeals: number;
      manuallyDeductedMeals: number;
      reservedMeals: number;
    };
    issues: {
      counts: Record<string, number> & { total: number; critical: number; high: number; medium: number };
      byCode: Record<string, number>;
    };
  };
  newSubscriptions: NewSubscription[];
  subscriptionAudits: SubscriptionAudit[];
}

const RISK_ORDER: Record<Risk, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  ok: 0,
};

const RISK_LABELS: Record<Risk, string> = {
  critical: "حرج",
  high: "مرتفع",
  medium: "متوسط",
  low: "منخفض",
  ok: "سليم",
};

function riskClass(risk: Risk) {
  if (risk === "critical") return "border-red-300 bg-red-50 text-red-800";
  if (risk === "high") return "border-orange-300 bg-orange-50 text-orange-800";
  if (risk === "medium") return "border-amber-300 bg-amber-50 text-amber-800";
  if (risk === "low") return "border-blue-300 bg-blue-50 text-blue-800";
  return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat("ar-SA").format(Number(value || 0));
}

function formatMoney(halala: number | null | undefined) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(Number(halala || 0) / 100);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(parsed);
}

async function fetchAudit(from: string, to: string): Promise<AuditReport> {
  const response = await api.get("/api/dashboard/accounting/subscription-operations-audit", {
    params: { from, to, includeDetails: true },
  });
  return response.data.data as AuditReport;
}

function csvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadAuditCsv(report: AuditReport) {
  const rows: unknown[][] = [[
    "النوع",
    "التاريخ",
    "رقم الاشتراك",
    "العميل",
    "الجوال",
    "مصدر الاشتراك",
    "طريقة التنفيذ",
    "حالة اليوم",
    "حالة التوصيل",
    "المتوقع",
    "المختار",
    "المحجوز",
    "المستهلك تلقائيًا",
    "الخصم اليدوي",
    "درجة الخطر",
    "المشاكل",
  ]];

  for (const subscription of report.newSubscriptions) {
    rows.push([
      "اشتراك جديد",
      subscription.createdAt ?? "",
      subscription.subscriptionId,
      subscription.customer.name,
      subscription.customer.phone,
      subscription.source.labelAr,
      subscription.fulfillmentLabelAr,
      subscription.status ?? "",
      "",
      subscription.totalMeals,
      "",
      "",
      "",
      "",
      RISK_LABELS[subscription.auditRisk],
      "",
    ]);
  }

  for (const subscription of report.subscriptionAudits) {
    for (const day of subscription.days) {
      rows.push([
        "مراجعة يوم",
        day.date,
        subscription.subscriptionId,
        subscription.customer.name,
        subscription.customer.phone,
        subscription.source.labelAr,
        subscription.fulfillmentLabelAr,
        day.day?.status ?? "لا يوجد سجل يوم",
        day.delivery?.status ?? "",
        day.expectedMeals,
        day.selectedMeals,
        day.allocation.reserved,
        day.allocation.consumed,
        day.manualDeduction.totalMeals,
        RISK_LABELS[day.risk],
        day.issues.map((row) => `${row.code}: ${row.message}`).join(" | "),
      ]);
    }
  }

  const csv = `\uFEFF${rows.map((row) => row.map(csvValue).join(",")).join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `subscription-audit-${report.range.from}-to-${report.range.to}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function SummaryCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <Badge variant="outline" className={riskClass(risk)}>
      {RISK_LABELS[risk]}
    </Badge>
  );
}

function SubscriptionAuditPage() {
  const today = getTodayKSADate();
  const [draftFrom, setDraftFrom] = useState(addAccountingDays(today, -2));
  const [draftTo, setDraftTo] = useState(today);
  const [from, setFrom] = useState(draftFrom);
  const [to, setTo] = useState(draftTo);
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const query = useQuery({
    queryKey: ["subscription-operations-audit", from, to],
    queryFn: () => fetchAudit(from, to),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const filteredAudits = useMemo(() => {
    const rows = query.data?.subscriptionAudits ?? [];
    return rows
      .filter((row) => fulfillmentFilter === "all" || row.fulfillmentMethod === fulfillmentFilter)
      .filter((row) => riskFilter === "all" || row.risk === riskFilter)
      .sort((left, right) => RISK_ORDER[right.risk] - RISK_ORDER[left.risk]);
  }, [query.data, fulfillmentFilter, riskFilter]);

  const applyRange = () => {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return;
    setFrom(draftFrom);
    setTo(draftTo);
  };

  return (
    <main className="space-y-6 p-4 md:p-6" dir="rtl">
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-l from-primary/10 via-background to-background">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheckIcon className="size-7 text-primary" />
                مراجعة الاشتراكات وخصم الوجبات
              </CardTitle>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                يجمع الاشتراكات الجديدة حسب مصدر الإنشاء وطريقة التنفيذ، ثم يراجع الحجز والاستهلاك والخصم اليدوي لكل يوم. أي يوم يجمع خصمًا يدويًا مع حجز أو استهلاك تلقائي يظهر كخطر حرج.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
                <RefreshCwIcon className={`ml-2 size-4 ${query.isFetching ? "animate-spin" : ""}`} />
                تحديث
              </Button>
              <Button
                variant="outline"
                disabled={!query.data}
                onClick={() => query.data && downloadAuditCsv(query.data)}
              >
                <DownloadIcon className="ml-2 size-4" />
                تحميل CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto_auto]">
          <div className="space-y-2">
            <Label htmlFor="audit-from">من</Label>
            <Input id="audit-from" type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-to">إلى</Label>
            <Input id="audit-to" type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fulfillment-filter">طريقة التنفيذ</Label>
            <select
              id="fulfillment-filter"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={fulfillmentFilter}
              onChange={(event) => setFulfillmentFilter(event.target.value as FulfillmentFilter)}
            >
              <option value="all">الكل</option>
              <option value="delivery">توصيل</option>
              <option value="pickup">استلام من الفرع</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-filter">درجة الخطر</Label>
            <select
              id="risk-filter"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
            >
              <option value="all">الكل</option>
              <option value="critical">حرج</option>
              <option value="high">مرتفع</option>
              <option value="medium">متوسط</option>
              <option value="ok">سليم</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={applyRange} disabled={!draftFrom || !draftTo || draftFrom > draftTo}>
              <CalendarRangeIcon className="ml-2 size-4" />
              تطبيق الفترة
            </Button>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">جاري تجهيز تقرير المراجعة…</CardContent></Card>
      ) : query.isError ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6 text-red-800">
            تعذر تحميل التقرير. تأكد من صلاحية المدير ثم أعد المحاولة.
          </CardContent>
        </Card>
      ) : query.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryCard title="الاشتراكات الجديدة" value={formatInteger(query.data.summary.newSubscriptions.total)} />
            <SummaryCard title="استلام من الفرع" value={formatInteger(query.data.summary.newSubscriptions.pickup)} />
            <SummaryCard title="توصيل" value={formatInteger(query.data.summary.newSubscriptions.delivery)} />
            <SummaryCard title="استهلاك تلقائي" value={formatInteger(query.data.summary.operations.automaticConsumedMeals)} hint="وجبات خلال الفترة" />
            <SummaryCard title="خصم يدوي" value={formatInteger(query.data.summary.operations.manuallyDeductedMeals)} hint="وجبات خلال الفترة" />
            <SummaryCard title="مشاكل حرجة" value={formatInteger(query.data.summary.issues.counts.critical)} hint={`${formatInteger(query.data.summary.issues.counts.total)} ملاحظة إجمالًا`} />
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="size-5 text-primary" />
                تقسيم الاشتراكات الجديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="من الفرع · استلام" value={formatInteger(query.data.summary.newSubscriptions.matrix.branch_pickup)} />
              <SummaryCard title="من التطبيق · استلام" value={formatInteger(query.data.summary.newSubscriptions.matrix.app_pickup)} />
              <SummaryCard title="من الفرع · توصيل" value={formatInteger(query.data.summary.newSubscriptions.matrix.branch_delivery)} />
              <SummaryCard title="من التطبيق · توصيل" value={formatInteger(query.data.summary.newSubscriptions.matrix.app_delivery)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الاشتراكات التي أُنشئت خلال الفترة</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-muted/60 text-right">
                  <tr>
                    {['العميل', 'رقم الاشتراك', 'المصدر', 'التنفيذ', 'الباقة', 'الوجبات', 'المبلغ', 'الإنشاء', 'الخطر'].map((label) => (
                      <th key={label} className="px-4 py-3 font-semibold">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.newSubscriptions.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">لا توجد اشتراكات جديدة في هذه الفترة.</td></tr>
                  ) : query.data.newSubscriptions.map((row) => (
                    <tr key={row.subscriptionId} className="border-t align-top">
                      <td className="px-4 py-3"><strong>{row.customer.name}</strong><div className="text-xs text-muted-foreground" dir="ltr">{row.customer.phone}</div></td>
                      <td className="px-4 py-3 font-mono text-xs">{row.subscriptionId}</td>
                      <td className="px-4 py-3">{row.source.labelAr}<div className="text-xs text-muted-foreground">{row.source.payment?.provider ?? "—"}</div></td>
                      <td className="px-4 py-3">{row.fulfillmentLabelAr}</td>
                      <td className="px-4 py-3">{row.plan.name}</td>
                      <td className="px-4 py-3">{formatInteger(row.totalMeals)}</td>
                      <td className="px-4 py-3">{formatMoney(row.totalPriceHalala)}</td>
                      <td className="px-4 py-3">{formatDateTime(row.createdAt)}</td>
                      <td className="px-4 py-3"><RiskBadge risk={row.auditRisk} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <TruckIcon className="size-5 text-primary" />
                  تدقيق الخصم والتنفيذ
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  مرتب من الأخطر إلى السليم. يظهر كل يوم توصيل متوقع داخل مدة الاشتراك حتى لو لم يُنشأ له سجل تشغيل.
                </p>
              </div>
              <Badge variant="secondary">{formatInteger(filteredAudits.length)} اشتراك</Badge>
            </div>

            {filteredAudits.length === 0 ? (
              <Card><CardContent className="p-10 text-center text-muted-foreground">لا توجد نتائج مطابقة للفلاتر.</CardContent></Card>
            ) : filteredAudits.map((subscription) => (
              <details key={subscription.subscriptionId} className={`group rounded-2xl border bg-card ${subscription.risk === "critical" ? "border-red-300" : ""}`}>
                <summary className="cursor-pointer list-none p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      {subscription.risk === "critical" || subscription.risk === "high" ? (
                        <AlertTriangleIcon className="mt-1 size-5 shrink-0 text-red-600" />
                      ) : (
                        <ShieldCheckIcon className="mt-1 size-5 shrink-0 text-emerald-600" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-base">{subscription.customer.name}</strong>
                          <RiskBadge risk={subscription.risk} />
                          <Badge variant="outline">{subscription.fulfillmentLabelAr}</Badge>
                          <Badge variant="outline">{subscription.source.labelAr}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                          {subscription.customer.phone} · {subscription.subscriptionId}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-xs">
                      <div><span className="block text-muted-foreground">تلقائي</span><strong>{formatInteger(subscription.periodSummary.automaticConsumedMeals)}</strong></div>
                      <div><span className="block text-muted-foreground">يدوي</span><strong>{formatInteger(subscription.periodSummary.manualDeductedMeals)}</strong></div>
                      <div><span className="block text-muted-foreground">أيام حرجة</span><strong>{formatInteger(subscription.periodSummary.criticalDays)}</strong></div>
                    </div>
                  </div>
                </summary>

                <div className="space-y-4 border-t p-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <SummaryCard title="إجمالي الوجبات" value={formatInteger(subscription.balance.totalMeals)} />
                    <SummaryCard title="متاح" value={formatInteger(subscription.balance.availableMeals)} />
                    <SummaryCard title="محجوز" value={formatInteger(subscription.balance.reservedMeals)} />
                    <SummaryCard title="مستهلك" value={formatInteger(subscription.balance.consumedMeals)} />
                    <SummaryCard title="غير مستلم" value={formatInteger(subscription.balance.displayedUnconsumedMeals)} />
                    <SummaryCard title="فرق المعادلة" value={formatInteger(subscription.balance.equationDifference)} hint={subscription.balance.balanced ? "الرصيد متوازن" : "يحتاج مراجعة"} />
                  </div>

                  {subscription.issues.length > 0 ? (
                    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4">
                      {subscription.issues.map((row, index) => (
                        <p key={`${row.code}-${index}`} className="text-sm text-red-900">
                          <strong>{row.code}</strong> — {row.message}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[1200px] text-sm">
                      <thead className="bg-muted/60 text-right">
                        <tr>
                          {['التاريخ', 'حالة اليوم', 'التوصيل/الاستلام', 'المتوقع', 'المختار', 'المحجوز', 'المستهلك تلقائيًا', 'الخصم اليدوي', 'الخطر', 'الملاحظات'].map((label) => (
                            <th key={label} className="px-3 py-3 font-semibold">{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {subscription.days.map((day) => (
                          <tr key={day.date} className={`border-t align-top ${day.risk === "critical" ? "bg-red-50/70" : ""}`}>
                            <td className="px-3 py-3 font-medium">{day.date}</td>
                            <td className="px-3 py-3">{day.day?.status ?? "لا يوجد سجل"}</td>
                            <td className="px-3 py-3">{day.delivery?.status ?? day.pickupRequests.map((row) => row.status).filter(Boolean).join("، ") || "—"}</td>
                            <td className="px-3 py-3">{formatInteger(day.expectedMeals)}</td>
                            <td className="px-3 py-3">{formatInteger(day.selectedMeals)}</td>
                            <td className="px-3 py-3">{formatInteger(day.allocation.reserved)}</td>
                            <td className="px-3 py-3">{formatInteger(day.allocation.consumed)}</td>
                            <td className="px-3 py-3 font-semibold">{formatInteger(day.manualDeduction.totalMeals)}</td>
                            <td className="px-3 py-3"><RiskBadge risk={day.risk} /></td>
                            <td className="max-w-[430px] px-3 py-3">
                              {day.issues.length === 0 ? (
                                <span className="text-emerald-700">لا توجد مشكلة واضحة</span>
                              ) : (
                                <ul className="space-y-1 text-xs leading-5">
                                  {day.issues.map((row, index) => (
                                    <li key={`${row.code}-${index}`}><strong>{row.code}</strong>: {row.message}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}
