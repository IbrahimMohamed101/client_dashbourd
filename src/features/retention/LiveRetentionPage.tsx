import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle, CalendarClock, Check, ChevronLeft, ClipboardList, Clock3,
  Copy, Download, MoreHorizontal, RefreshCw, Search, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  fetchLiveRetention, useLiveRetention, type LiveRetentionRow,
  type RetentionFilterStatus,
} from "./liveRetentionApi";
import { RetentionFollowupDialog } from "./RetentionFollowupDialog";

const STATUS_LABEL: Record<RetentionFilterStatus, string> = {
  all: "كل العملاء", active: "استحقاق ساري", due_soon: "قريب من الانتهاء",
  grace_14: "داخل مهلة 14 يومًا", overdue_14: "بعد مهلة 14 يومًا",
  scheduled: "اشتراك مجدول", review: "يحتاج مراجعة", canceled: "ملغي",
};
const STATUS_STYLE: Record<RetentionFilterStatus, string> = {
  all: "border-slate-300 bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  active: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  due_soon: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  grace_14: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  overdue_14: "border-red-300 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  review: "border-orange-300 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  scheduled: "border-slate-300 bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  canceled: "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
};
const REASONS: Record<string, string> = {
  no_verified_subscription: "لا يوجد اشتراك مؤكد",
  orphan_entitlement_batch: "رصيد غير مرتبط باشتراك",
  unsettled_entitlement_application: "إضافة رصيد لم تكتمل",
  unverified_commercial_entitlement: "دفع أو استحقاق غير مؤكد",
  no_eligible_entitlement: "لا يوجد رصيد مستحق",
  missing_entitlement_dates: "تواريخ الاستحقاق ناقصة",
  missing_entitlement_balance: "الرصيد غير مكتمل",
  unproven_early_exhaustion: "نفاد رصيد دون تاريخ موثق",
  invalid_exhaustion_timestamp: "تاريخ النفاد غير صحيح",
  ambiguous_account_merge: "دمج حساب يحتاج مراجعة",
  verified_entitlement_boundary: "استحقاق موثق",
  paid_future_entitlement: "اشتراك مجدول",
  usable_entitlement: "رصيد متاح",
  all_contracts_canceled: "الاشتراكات ملغاة",
};
const OUTCOMES: Record<string, string> = {
  no_answer: "لم يرد", contacted: "تم التواصل", interested: "مهتم",
  callback_requested: "طلب معاودة الاتصال", not_interested: "غير مهتم",
  client_claims_renewed: "ذكر أنه جدد", do_not_contact: "طلب عدم التواصل",
};
const number = (value: number) => new Intl.NumberFormat("en-GB").format(value);
const date = (value: string | null) => {
  if (!value) return "غير محدد";
  const instant = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00Z") : new Date(value);
  return Number.isFinite(instant.valueOf())
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Riyadh" }).format(instant)
    : "غير محدد";
};
const clock = (value: string) => new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Riyadh",
}).format(new Date(value));
const saudiDay = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(iso));
  const part = (key: string) => parts.find((item) => item.type === key)?.value || "00";
  return [part("year"), part("month"), part("day")].join("-");
};
const dayIndex = (value: string) => Date.parse(value + "T00:00:00Z") / 86400000;
const daysBetween = (then: string, now: string) => Math.round(dayIndex(now) - dayIndex(then));
const displayName = (value: string) => value.trim().replace(/[A-Za-z][A-Za-z'-]*/g, (word) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) || "بدون اسم مسجل";
const phoneDisplay = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("966") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (/^5\d{8}$/.test(local)) return "+966 " + local.slice(0, 2) + " " + local.slice(2, 5) + " " + local.slice(5);
  return value || "غير متاح";
};
const csvCell = (value: unknown) => {
  const raw = String(value ?? "");
  const safe = /^[\s]*[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
};
const statusIcon = (status: RetentionFilterStatus) => {
  if (status === "active") return <Check className="size-4" />;
  if (status === "overdue_14") return <AlertTriangle className="size-4" />;
  if (status === "review") return <ShieldAlert className="size-4" />;
  if (status === "due_soon" || status === "grace_14") return <Clock3 className="size-4" />;
  return <CalendarClock className="size-4" />;
};
const StatusChip = ({ status }: { status: RetentionFilterStatus }) => (
  <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-semibold " + STATUS_STYLE[status]}>
    {statusIcon(status)}{STATUS_LABEL[status]}
  </span>
);

export function LiveRetentionPage({ initialStatus = "all" }: { initialStatus?: RetentionFilterStatus }) {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<RetentionFilterStatus>(initialStatus);
  const [draftSearch, setDraftSearch] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [uncontactedOnly, setUncontactedOnly] = React.useState(false);
  const [dueFrom, setDueFrom] = React.useState("");
  const [dueTo, setDueTo] = React.useState("");
  const [selectedFollowup, setSelectedFollowup] = React.useState<{ id: string; name: string; blocked: boolean } | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState("");
  const [copiedPhone, setCopiedPhone] = React.useState("");
  React.useEffect(() => { setStatus(initialStatus); setPage(1); }, [initialStatus]);
  React.useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(draftSearch.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [draftSearch]);
  const params = React.useMemo(() => ({
    page, pageSize, status, search, uncontactedOnly,
    ...(dueFrom ? { dueFrom } : {}), ...(dueTo ? { dueTo } : {}),
  }), [page, pageSize, status, search, uncontactedOnly, dueFrom, dueTo]);
  const query = useLiveRetention(params);
  const result = query.isError ? undefined : query.data;
  const today = result ? saudiDay(result.asOf) : saudiDay(new Date().toISOString());
  const pages = result ? Math.max(1, Math.ceil(result.pagination.total / pageSize)) : 1;
  const openProfile = (userId: string) => void navigate({
    to: "/customer-management", search: { userId, panel: "profile" },
  });
  const changeStatus = (next: RetentionFilterStatus) => { setStatus(next); setPage(1); };

  const exportCsv = async () => {
    setExportError("");
    setExporting(true);
    try {
      const total = result?.pagination.total ?? 0;
      if (total > 5000) throw new Error("التصدير يتجاوز الحد المسموح؛ ضيّق الفلاتر أولًا.");
      const rows: LiveRetentionRow[] = [];
      const totalPages = Math.ceil(total / 50);
      for (let next = 1; next <= totalPages; next++) {
        const batch = await fetchLiveRetention({ ...params, page: next, pageSize: 50 });
        rows.push(...batch.rows);
      }
      const headers = ["العميل", "الجوال", "الحالة", "موعد الاستحقاق", "سبب المراجعة", "الرصيد", "آخر اشتراك", "آخر متابعة", "الموظف", "النتيجة", "طلب عدم التواصل"];
      const lines = [headers, ...rows.map((row) => [
        row.name, row.phone, STATUS_LABEL[row.status], row.dueDate || "", REASONS[row.reason] || row.reason,
        row.remainingAndReserved ?? "", date(row.lastRecordedAt),
        row.latestFollowup ? date(row.latestFollowup.createdAt) : "",
        row.latestFollowup?.actor || "", row.latestFollowup ? OUTCOMES[row.latestFollowup.outcome] || row.latestFollowup.outcome : "",
        row.doNotContact ? "نعم" : "لا",
      ])];
      const csv = "\uFEFF" + lines.map((fields) => fields.map(csvCell).join(",")).join("\r\n");
      const link = document.createElement("a");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      link.href = url;
      link.download = "basicdiet-retention-" + today + ".csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "تعذر تصدير النتائج.");
    } finally {
      setExporting(false);
    }
  };

  const pager = (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
      <span>النتائج: <strong>{number(result?.pagination.total ?? 0)}</strong> · صفحة {number(page)} من {number(pages)}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((n) => n - 1)}>السابق</Button>
        <Button type="button" variant="outline" size="sm" disabled={page >= pages || query.isFetching} onClick={() => setPage((n) => n + 1)}>التالي <ChevronLeft className="size-4" /></Button>
      </div>
    </div>
  );

  return (
    <section className="space-y-4 pb-8" dir="rtl" aria-label="التجديدات الحالية">
      <Card className="rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">متابعة التجديدات الحالية</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">الأولوية حسب الاستحقاق الموثق، وليس تاريخ إنشاء الاشتراك.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {result && <span className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium">آخر تحديث: {date(result.asOf)} · {clock(result.asOf)}</span>}
              <Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
                <RefreshCw className={"size-4 " + (query.isFetching ? "animate-spin" : "")} /> تحديث البيانات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.isLoading && <p role="status" className="animate-pulse rounded-xl bg-muted p-6 text-sm">جاري تحميل بيانات التجديدات...</p>}
          {query.isError && <div role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">تعذر تحميل البيانات الحالية. تأكد من اتصال الخدمة وصلاحية العرض. لن تُعرض أرقام تاريخية بدلًا منها.</div>}
          {result && <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
              {(["all", "overdue_14", "grace_14", "due_soon", "active", "review"] as const).map((key) => (
                <button key={key} type="button" aria-pressed={status === key} onClick={() => changeStatus(key)}
                  className={"rounded-xl border p-3 text-right transition hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary " +
                    (status === key ? "ring-2 ring-primary " : "") + STATUS_STYLE[key]}>
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold">{statusIcon(key)}{STATUS_LABEL[key]} <span className="mr-auto text-[11px] opacity-75">عرض</span></span>
                  <span className="mt-2 block text-2xl font-bold tabular-nums">{number(result.totals[key] ?? 0)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-[13px]">
              {(["scheduled", "canceled"] as const).map((key) => <button key={key} type="button"
                onClick={() => changeStatus(key)} className={"rounded-lg border px-3 py-2 hover:border-primary " + (status === key ? "border-primary bg-primary/5" : "")}>
                {STATUS_LABEL[key]} · {number(result.totals[key] ?? 0)}
              </button>)}
            </div>
            {status === "review" && <div role="alert" className="rounded-xl border border-amber-400 bg-amber-50 p-3 text-[13px] leading-6 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
              <ShieldAlert className="ml-2 inline size-4" />
              لا تتواصل بغرض الاستعادة قبل التأكد من الرصيد وموعد النفاد. لا توجد موافقة تسويقية موثقة في هذا التقرير.
            </div>}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1">
                <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
                <Input aria-label="بحث فوري بالاسم أو الجوال" className="pr-9" value={draftSearch} maxLength={80}
                  onChange={(event) => setDraftSearch(event.target.value)} placeholder="ابحث بالاسم أو رقم الجوال" />
              </div>
              <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-[13px]">
                <input type="checkbox" checked={uncontactedOnly} onChange={(event) => { setUncontactedOnly(event.target.checked); setPage(1); }} />
                لم تتم متابعته
              </label>
              <label className="flex items-center gap-1 text-[13px]">الاستحقاق من
                <Input aria-label="الاستحقاق من" className="w-36" type="date" value={dueFrom} max={dueTo || undefined}
                  onChange={(event) => { setDueFrom(event.target.value); setPage(1); }} />
              </label>
              <label className="flex items-center gap-1 text-[13px]">إلى
                <Input aria-label="الاستحقاق إلى" className="w-36" type="date" min={dueFrom || undefined} value={dueTo}
                  onChange={(event) => { setDueTo(event.target.value); setPage(1); }} />
              </label>
              <label className="flex items-center gap-1 text-[13px]">الصفوف
                <select aria-label="عدد الصفوف" className="h-10 rounded-md border bg-background px-2" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                  {[10, 20, 50].map((size) => <option value={size} key={size}>{size}</option>)}
                </select>
              </label>
              <Button type="button" variant="outline" onClick={() => {
                setDraftSearch(""); setSearch(""); setStatus("all"); setPage(1); setDueFrom(""); setDueTo(""); setUncontactedOnly(false);
              }}>مسح</Button>
              <Button type="button" variant="outline" disabled={exporting || !result.pagination.total} onClick={() => void exportCsv()}>
                <Download className="size-4" /> {exporting ? "جاري التصدير..." : "تصدير CSV"}
              </Button>
            </div>
            {exportError && <p role="alert" className="text-[13px] text-destructive">{exportError}</p>}
            {pager}
            <div className="max-h-[70vh] overflow-auto rounded-xl border">
              <table className="w-full min-w-[1120px] text-right text-[13px] leading-6">
                <thead className="sticky top-0 z-10 bg-muted text-foreground">
                  <tr>
                    <th scope="col" className="p-3">العميل</th>
                    <th scope="col" className="p-3">الحالة</th>
                    <th scope="col" className="p-3">موعد الاستحقاق</th>
                    <th scope="col" className="p-3">الرصيد</th>
                    <th scope="col" className="p-3">آخر سجل اشتراك</th>
                    <th scope="col" className="p-3">آخر متابعة</th>
                    <th scope="col" className="p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => {
                    const elapsed = row.dueDate ? daysBetween(row.dueDate, today) : null;
                    const since = daysBetween(saudiDay(row.lastRecordedAt), today);
                    return <tr key={row.userId} tabIndex={0}
                      aria-label={"فتح ملف " + displayName(row.name)}
                      onClick={() => openProfile(row.userId)}
                      onKeyDown={(event) => { if (event.target === event.currentTarget && event.key === "Enter") openProfile(row.userId); }}
                      className="cursor-pointer border-t transition-colors hover:bg-muted/40 focus-visible:bg-muted/50">
                      <td className="p-3 align-top">
                        <Link to="/customer-management" search={{ userId: row.userId, panel: "profile" }}
                          onClick={(event) => event.stopPropagation()} className="font-semibold text-foreground hover:underline">{displayName(row.name)}</Link>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="whitespace-nowrap text-muted-foreground" dir="ltr">{phoneDisplay(row.phone)}</span>
                          {row.phone && <button aria-label={"نسخ رقم جوال " + displayName(row.name)} type="button" title="نسخ الجوال"
                            onClick={(event) => { event.stopPropagation(); void navigator.clipboard.writeText(row.phone).then(() => { setCopiedPhone(row.userId); }).catch(() => setCopiedPhone("")); }}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                            {copiedPhone === row.userId ? <Check className="size-4" /> : <Copy className="size-4" />}
                          </button>}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <StatusChip status={row.status} />
                        {row.doNotContact && <p className="mt-1 font-semibold text-destructive">ممنوع التواصل</p>}
                        {row.status === "review" && <p className="mt-1 max-w-48 text-amber-800 dark:text-amber-300" title={row.reason}>
                          {REASONS[row.reason] || "يجب تدقيق بيانات الاستحقاق"}
                        </p>}
                      </td>
                      <td className="p-3 align-top">
                        <strong className="whitespace-nowrap tabular-nums">{date(row.dueDate)}</strong>
                        {elapsed !== null && row.status === "overdue_14" && <p className="font-semibold text-red-700 dark:text-red-300">متأخر {number(Math.max(0, elapsed))} يوم</p>}
                        {elapsed !== null && (row.status === "due_soon" || row.status === "active") && elapsed < 0 && <p className="text-muted-foreground">متبقي {number(-elapsed)} يوم</p>}
                        {row.dueDateIsLatestValidityBound && <p className="text-muted-foreground" title="قد ينفد الرصيد قبل هذا التاريخ">حد الصلاحية المتوقع</p>}
                      </td>
                      <td className="p-3 align-top">
                        <span className={"whitespace-nowrap font-semibold tabular-nums " +
                          (row.remainingAndReserved === 0 ? "text-red-700 dark:text-red-300" : "")}>
                          {row.remainingAndReserved === null ? "غير معلوم" : number(row.remainingAndReserved) + " وجبة"}
                        </span>
                      </td>
                      <td className="p-3 align-top"><span className="tabular-nums">{date(row.lastRecordedAt)}</span>
                        <p className="text-muted-foreground">منذ {number(Math.max(0, since))} يوم</p></td>
                      <td className="p-3 align-top">
                        {row.latestFollowup ? <>
                          <strong>{OUTCOMES[row.latestFollowup.outcome] || row.latestFollowup.outcome}</strong>
                          <p className="tabular-nums text-muted-foreground">{date(row.latestFollowup.createdAt)}</p>
                          <p className="max-w-52 truncate text-muted-foreground" title={row.latestFollowup.actor}>{row.latestFollowup.actor}</p>
                        </> : <span className="font-medium text-amber-800 dark:text-amber-300">لم تتم متابعته</span>}
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <Button size="sm" type="button" variant="outline"
                            onClick={() => setSelectedFollowup({ id: row.userId, name: row.name, blocked: row.doNotContact })}>
                            {row.doNotContact ? "عرض السجل" : "تسجيل متابعة"}
                          </Button>
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="outline" size="icon" aria-label="إجراءات أخرى">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openProfile(row.userId)}>فتح ملف العميل</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>;
                  })}
                  {!result.rows.length && <tr><td colSpan={7} className="p-5 text-muted-foreground">لا توجد نتائج مطابقة.</td></tr>}
                </tbody>
              </table>
            </div>
            {pager}
            <details className="rounded-xl border bg-muted/20 p-3 text-[13px]">
              <summary className="cursor-pointer font-semibold"><ClipboardList className="ml-2 inline size-4" />ملاحظات قراءة البيانات وحدود التصنيف</summary>
              <div className="mt-2 space-y-2 leading-6 text-muted-foreground">
                <p>الرصيد يشمل المتبقي والمحجوز. تاريخ تسجيل الاشتراك ليس إثبات دفع.</p>
                {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            </details>
          </>}
        </CardContent>
      </Card>
      {selectedFollowup && <RetentionFollowupDialog key={selectedFollowup.id} customer={selectedFollowup}
        onClose={() => setSelectedFollowup(null)} />}
    </section>
  );
}
