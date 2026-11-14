import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, ArrowDownToLine, CalendarDays, CreditCard,
  FileSpreadsheet, Layers, RefreshCcw, ReceiptText, ShieldCheck, Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchPosCatalog, posCatalogKey } from "@/features/pos/catalogApi";
import { posChannelLabel } from "@/features/pos/posSaleChannels";
import {
  ACCOUNTING_RANGE_PRESETS, resolveAccountingRangePreset,
  validateAccountingRange, type AccountingDateRange,
  type AccountingRangePresetId,
} from "../accountingRange";
import { getTodayKSADate } from "@/utils/ksaDate";
import { fetchSubscriptionPaymentRangeReport } from "@/utils/fetchDashboardSupportData";
import {
  fetchPosAccountingRange, type PosAccountingInvoice,
  type PosAccountingRefund,
} from "../posAccountingApi";
import { buildFinancialCenterSheets } from "../buildFinancialCenterSheets";
import { createAccountingXlsx, downloadAccountingXlsx } from "../accountingXlsx";

const money = (value: number | undefined | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("ar-SA-u-nu-latn", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value / 100) + " ر.س" : "—";
const number = (value: number | undefined | null) =>
  typeof value === "number" ? new Intl.NumberFormat("ar-SA-u-nu-latn").format(value) : "—";

export function AccountingCommandCenter() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const [range, setRange] = useState<AccountingDateRange>(
    () => resolveAccountingRangePreset("last30", getTodayKSADate()));
  const [draft, setDraft] = useState<AccountingDateRange>(range);
  const [preset, setPreset] = useState<AccountingRangePresetId | "custom">("last30");
  const [channelFilter, setChannelFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const rangeError = validateAccountingRange(draft);

  const posQuery = useQuery({
    queryKey: ["accounting", "command-center", "pos", range.from, range.to],
    queryFn: () => fetchPosAccountingRange({ ...range, limit: 100, offset: 0 }),
    enabled: isSuperadmin,
    staleTime: 30_000,
    retry: false,
  });
  const subscriptionQuery = useQuery({
    queryKey: ["accounting", "command-center", "subscriptions", range.from, range.to],
    queryFn: () => fetchSubscriptionPaymentRangeReport({
      ...range, includeDetails: true, fulfillmentMethod: "all", comparePrevious: true,
    }),
    enabled: isSuperadmin,
    staleTime: 30_000,
    retry: false,
  });
  const catalogQuery = useQuery({
    queryKey: posCatalogKey,
    queryFn: fetchPosCatalog,
    enabled: isSuperadmin,
    staleTime: 60_000,
    retry: false,
  });

  const pos = posQuery.data;
  const subscriptions = subscriptionQuery.data?.data;
  const subscriptionNet = subscriptions?.summary?.netCollectionHalala;
  const complete = Boolean(pos && subscriptions && Array.isArray(subscriptions.items) &&
    typeof subscriptionNet === "number" && !posQuery.isFetching && !subscriptionQuery.isFetching);
  const channels = catalogQuery.data?.channels;
  const combinedNet = complete ? subscriptionNet! + pos!.summary.netAfterRefundDocumentsHalalas : null;
  const channelRows = useMemo(() => {
    if (!pos) return [];
    return pos.channels.filter(item => channelFilter === "all" || item.channel === channelFilter);
  }, [pos, channelFilter]);
  const dailyChart = useMemo(() => {
    if (!pos) return [];
    const dates = new Map<string, { date: string; pos: number; subscriptions: number }>();
    for (const day of pos.daily) {
      dates.set(day.businessDate, {
        date: day.businessDate, pos: day.netAfterRefundDocumentsHalalas / 100, subscriptions: 0,
      });
    }
    for (const day of subscriptions?.dailyBreakdown ?? []) {
      if (!day.businessDate) continue;
      const item = dates.get(day.businessDate) ?? { date: day.businessDate, pos: 0, subscriptions: 0 };
      item.subscriptions = (day.netCollectionHalala ?? 0) / 100;
      dates.set(day.businessDate, item);
    }
    return [...dates.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [pos, subscriptions]);

  function choosePreset(next: AccountingRangePresetId) {
    const updated = resolveAccountingRangePreset(next, getTodayKSADate());
    setPreset(next); setDraft(updated); setRange(updated);
    setExportError(null); setChannelFilter("all");
  }
  function applyRange() {
    if (rangeError) return;
    setRange({ ...draft }); setChannelFilter("all"); setExportError(null);
  }
  async function exportFullExcel() {
    if (!pos || !subscriptions || !complete || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const maxItems = Math.max(pos.pagination.invoicesTotal, pos.pagination.refundsTotal);
      // Never generate an apparently complete workbook from truncated records.
      if (maxItems > 10_000) {
        throw new Error("عدد الحركات يتجاوز حد التصدير الآمن (10,000 لكل نوع). استخدم نطاقًا أقصر.");
      }
      const invoices: PosAccountingInvoice[] = [...pos.invoices];
      const refunds: PosAccountingRefund[] = [...pos.refunds];
      for (let offset = pos.pagination.limit; offset < maxItems; offset += 250) {
        const page = await fetchPosAccountingRange({ ...range, offset, limit: 250 });
        if (page.pagination.invoicesTotal !== pos.pagination.invoicesTotal ||
            page.pagination.refundsTotal !== pos.pagination.refundsTotal ||
            page.summary.grossHalalas !== pos.summary.grossHalalas ||
            page.summary.refundDocumentsHalalas !== pos.summary.refundDocumentsHalalas) {
          throw new Error("تغيّرت الفواتير أثناء التصدير؛ حدّث التقرير ثم حاول مجددًا.");
        }
        invoices.push(...page.invoices);
        refunds.push(...page.refunds);
      }
      const sheets = buildFinancialCenterSheets(subscriptions, pos, invoices, refunds, channels);
      downloadAccountingXlsx(
        createAccountingXlsx(sheets),
        `BasicDiet-Financial-Center-${range.from}-${range.to}.xlsx`,
      );
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "تعذر تجهيز ملف Excel.");
    } finally {
      setExporting(false);
    }
  }

  if (!isSuperadmin) {
    return <Alert variant="destructive"><AlertTriangle className="size-4" />
      <AlertTitle>صلاحية الإدارة العليا مطلوبة</AlertTitle>
      <AlertDescription>مركز القيادة المالية وتصدير بياناته متاحان للسوبر أدمن فقط.</AlertDescription>
    </Alert>;
  }
  const loading = posQuery.isLoading || subscriptionQuery.isLoading;
  return (
    <section dir="rtl" aria-label="مركز القيادة المالية" className="space-y-5 text-right">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-sky-800/30 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1">
                <ShieldCheck className="size-3.5" /> إدارة عليا · قراءة فقط
              </span>
              <span>الرياض · يوم العمل المالي</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              مركز القيادة المالية
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              الاشتراكات، البيع المباشر، تطبيقات التوصيل، والمرتجعات في عرض واحد.
              المبالغ من السجلات المعتمدة على السيرفر، وليست تقديرات من المتصفح.
            </p>
          </div>
          <Button type="button" className="min-h-12 gap-2 bg-white text-slate-950 hover:bg-slate-100"
            disabled={!complete || exporting} onClick={() => void exportFullExcel()}>
            <FileSpreadsheet className="size-5" />
            {exporting ? "تجهيز صفحات Excel..." : "تنزيل Excel شامل (.xlsx)"}
            <ArrowDownToLine className="size-4" />
          </Button>
        </div>
        <div className="relative mt-6 grid gap-2 border-t border-white/15 pt-4 text-xs text-slate-200 sm:grid-cols-3">
          <span>الفترة: {range.from} — {range.to}</span>
          <span>الاشتراكات: {subscriptionQuery.isSuccess ? "متصلة" : "غير مكتملة"}</span>
          <span>نقطة البيع: {posQuery.isSuccess ? "متصلة" : "غير مكتملة"}</span>
        </div>
      </header>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {ACCOUNTING_RANGE_PRESETS.map(item => (
              <Button key={item.id} type="button" size="sm"
                variant={preset === item.id ? "default" : "outline"}
                className="min-h-10" onClick={() => choosePreset(item.id)}>
                {item.label}
              </Button>
            ))}
          </div>
          <Button type="button" variant="outline" className="min-h-10 gap-2"
            onClick={() => { void posQuery.refetch(); void subscriptionQuery.refetch(); void catalogQuery.refetch(); }}>
            <RefreshCcw className="size-4" /> تحديث البيانات
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
          <label className="grid gap-1.5 text-xs font-medium">
            من تاريخ
            <Input type="date" aria-label="تاريخ بداية التقرير" value={draft.from}
              className="min-h-11 w-44" onChange={e => { setPreset("custom"); setDraft(prev => ({
                ...prev, from: e.target.value,
              })); }} />
          </label>
          <label className="grid gap-1.5 text-xs font-medium">
            إلى تاريخ
            <Input type="date" aria-label="تاريخ نهاية التقرير" value={draft.to}
              className="min-h-11 w-44" onChange={e => { setPreset("custom"); setDraft(prev => ({
                ...prev, to: e.target.value,
              })); }} />
          </label>
          <Button type="button" className="min-h-11 gap-2"
            disabled={!!rangeError || (draft.from === range.from && draft.to === range.to)}
            onClick={applyRange}><CalendarDays className="size-4" /> تطبيق الفترة</Button>
          {rangeError && <p role="alert" className="text-xs text-destructive">{rangeError}</p>}
        </div>
      </div>

      {(posQuery.isError || subscriptionQuery.isError) && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" /><AlertTitle>البيانات المالية غير مكتملة</AlertTitle>
          <AlertDescription>
            {posQuery.isError ? "تعذر تحميل تقرير الكاشير من الباك إند. " : ""}
            {subscriptionQuery.isError ? "تعذر تحميل تحصيل الاشتراكات. " : ""}
            لن يظهر مجموع موحّد ولن يُسمح بتصدير ملف ناقص. تأكد من إتاحة واجهات التقارير وصلاحيات السوبر أدمن.
          </AlertDescription>
        </Alert>
      )}
      {exportError && <Alert variant="destructive"><AlertTriangle className="size-4" />
        <AlertTitle>لم يتم تصدير الملف</AlertTitle><AlertDescription>{exportError}</AlertDescription>
      </Alert>}

      {loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Layers className="size-5" />} title="صافي تحصيل الاشتراكات"
            value={money(subscriptionNet)} note="حسب التقرير المالي للاشتراكات" />
          <Metric icon={<ReceiptText className="size-5" />} title="مبيعات POS"
            value={money(pos?.summary.grossHalalas)} note={`${number(pos?.summary.invoiceCount)} فاتورة مسجلة`} />
          <Metric icon={<Wallet className="size-5" />} title="المباشر: كاش + شبكة"
            value={money(pos ? pos.summary.cashGrossHalalas + pos.summary.networkGrossHalalas : null)}
            note="قيمة الفواتير المباشرة قبل المرتجعات" />
          <Metric icon={<CreditCard className="size-5" />} title="مستحقات تطبيقات التوصيل"
            value={money(pos?.summary.appReceivableGrossHalalas)}
            note="ليست تحصيلًا نقديًا من المطعم" />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">حركة المبيعات والتحصيل</h3>
              <p className="mt-1 text-xs text-muted-foreground">صافي POS بعد الإشعارات مقابل صافي تحصيل الاشتراكات · ريال</p>
            </div>
            <Badge variant="outline">بيانات سيرفر · تاريخ مالي</Badge>
          </div>
          {dailyChart.length ? (
            <div className="h-72 w-full" dir="ltr" role="img" aria-label="مقارنة يومية بين POS والاشتراكات">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 4" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} width={58} />
                  <Tooltip formatter={(v) => `${Number(v ?? 0).toFixed(2)} ر.س`} />
                  <Legend formatter={(v) => v === "pos" ? "صافي POS" : "تحصيل الاشتراكات"} />
                  <Bar dataKey="pos" fill="#1E5F6A" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="subscriptions" fill="#D4A55B" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState text="لا توجد حركات يومية في الفترة المختارة." />}
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-lg font-semibold">ملخص التسوية والمراجعة</h3>
          <p className="mt-1 text-xs text-muted-foreground">توضيح ما تم تسجيله وما لم تتم تسويته</p>
          <dl className="mt-5 space-y-4 text-sm">
            <MetricRow label="إجمالي إشعارات مرتجع POS" value={money(pos?.summary.refundDocumentsHalalas)} />
            <MetricRow label="صافي فواتير POS بعد الإشعارات" value={money(pos?.summary.netAfterRefundDocumentsHalalas)} />
            <MetricRow label="إجمالي المستحقات الخارجية" value={money(pos?.summary.appReceivableGrossHalalas)} />
            <div className="rounded-xl bg-muted/50 p-4">
              <dt className="text-sm text-muted-foreground">صافي الحركات المالية المسجلة</dt>
              <dd className="mt-2 text-2xl font-bold tabular-nums">{money(combinedNet)}</dd>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                مجموع صافي تحصيل الاشتراكات وصافي فواتير POS بعد الإشعارات.
                لا يساوي الربح أو رصيد البنك أو التسوية الفعلية مع التطبيقات.
              </p>
            </div>
          </dl>
          <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-6">
            <AlertTriangle className="mt-1 size-4 shrink-0 text-amber-600" />
            <p>إشعارات المرتجع لا تثبت دفع الأموال. ومستحقات تطبيقات التوصيل لا تُضاف لدرج الكاش إلا بتسوية مستقلة موثقة.</p>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">أداء قنوات البيع</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              المطعم، هنجرستيشن، كيتا، جاهز وأي قناة جديدة تظهر لها فواتير فعلية.
            </p>
          </div>
          <select aria-label="فلترة القنوات" value={channelFilter}
            className="min-h-10 rounded-md border bg-background px-3 text-sm"
            onChange={e => setChannelFilter(e.target.value)}>
            <option value="all">كل القنوات</option>
            {pos?.channels.map(item => (
              <option key={item.channel} value={item.channel}>
                {posChannelLabel(item.channel, channels)}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead><tr className="border-b bg-muted/40 text-xs">
              <th className="p-3">القناة</th><th className="p-3">الفواتير</th>
              <th className="p-3">إجمالي مسجل</th><th className="p-3">مرتجعات مسجلة</th>
              <th className="p-3">صافي مسجل</th><th className="p-3">كاش / شبكة</th>
              <th className="p-3">مستحقات تطبيق</th>
            </tr></thead>
            <tbody>{channelRows.map(item => (
              <tr key={item.channel} className="border-b last:border-0">
                <td className="p-3 font-semibold">{posChannelLabel(item.channel, channels)}</td>
                <td className="p-3 tabular-nums">{number(item.invoiceCount)}</td>
                <td className="p-3 tabular-nums">{money(item.grossHalalas)}</td>
                <td className="p-3 tabular-nums">{money(item.refundDocumentsHalalas)}</td>
                <td className="p-3 font-semibold tabular-nums">{money(item.netAfterRefundDocumentsHalalas)}</td>
                <td className="p-3 tabular-nums">{money(item.cashGrossHalalas + item.networkGrossHalalas)}</td>
                <td className="p-3 tabular-nums">{money(item.appReceivableGrossHalalas)}</td>
              </tr>
            ))}</tbody>
          </table>
          {!pos ? <EmptyState text="لم يتم تحميل تقرير نقطة البيع." /> :
            !channelRows.length ? <EmptyState text="لا توجد فواتير مسجلة لهذه القناة أو الفترة." /> : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold"><ReceiptText className="size-4" /> أحدث فواتير الفترة</h3>
          <p className="my-2 text-xs text-muted-foreground">
            معاينة أول {number(pos?.invoices.length ?? 0)} فاتورة؛ Excel ينزّل كل صفحات الفترة.
          </p>
          <div className="divide-y">
            {pos?.invoices.slice(0, 7).map(item => (
              <div key={item.number} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div><p className="font-semibold" dir="ltr">{item.number}</p>
                  <p className="text-xs text-muted-foreground">{posChannelLabel(item.channel, channels)} · {item.businessDate}</p>
                </div>
                <strong className="tabular-nums">{money(item.totals.grossHalalas)}</strong>
              </div>
            ))}
            {!pos?.invoices.length && <EmptyState text="لا توجد فواتير للعرض." />}
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold"><Activity className="size-4" /> الضبط والتدقيق</h3>
          <div className="mt-4 space-y-3">
            <InfoPill title="فواتير POS" value={number(pos?.summary.invoiceCount)} />
            <InfoPill title="إشعارات المرتجع" value={number(pos?.summary.refundCount)} />
            <InfoPill title="حركات تحصيل الاشتراكات" value={number(subscriptions?.summary?.totalPaymentsCount)} />
            <InfoPill title="حركات تحتاج مراجعة" value={number(subscriptions?.summary?.reviewItemsCount)} />
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            كل مبلغ بعملة الريال، مأخوذ من الهللات التي سجلها السيرفر. لا توجد تسوية تلقائية
            بين طلبات التطبيقات أو الفواتير أو إيراد الاشتراكات.
          </p>
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, title, value, note }: {
  icon: ReactNode; title: string; value: string; note: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <span className="rounded-lg bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{icon}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
function MetricRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b pb-3">
    <dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd>
  </div>;
}
function InfoPill({ title, value }: { title: string; value: string }) {
  return <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-3 text-sm">
    <span className="text-muted-foreground">{title}</span><strong>{value}</strong>
  </div>;
}
function EmptyState({ text }: { text: string }) {
  return <p role="status" className="p-5 text-center text-sm text-muted-foreground">{text}</p>;
}
