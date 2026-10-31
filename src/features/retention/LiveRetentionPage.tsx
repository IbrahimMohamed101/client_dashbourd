import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LIVE_RETENTION_STATUSES, useLiveRetention, type RetentionFilterStatus } from "./liveRetentionApi";

const STATUS_LABEL: Record<RetentionFilterStatus, string> = {
  all: "كل العملاء",
  active: "استحقاق ساري",
  due_soon: "قريب من الانتهاء",
  grace_14: "داخل مهلة 14 يومًا",
  overdue_14: "بعد مهلة 14 يومًا",
  scheduled: "اشتراك مجدول",
  review: "يحتاج مراجعة",
  canceled: "ملغي",
};
const number = (value: number) => new Intl.NumberFormat("ar-SA").format(value);
const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
  }).format(new Date(value));

export function LiveRetentionPage() {
  const [status, setStatus] = React.useState<RetentionFilterStatus>("all");
  const [draftSearch, setDraftSearch] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const params = React.useMemo(() => ({
    page, pageSize: 20, status, search,
  }), [page, search, status]);
  const query = useLiveRetention(params);
  const result = query.data;

  return (
    <section className="space-y-5" aria-label="التجديدات الحالية" dir="rtl">
      <Card className="rounded-2xl">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>متابعة اشتراكات العملاء — الحالة الحالية</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                قراءة محمية من Backend. لا تستخدم أرقام أكتوبر التاريخية لاتخاذ قرارات التواصل اليوم.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className="size-4" /> تحديث البيانات
            </Button>
          </div>
          {result ? (
            <p className="text-xs text-muted-foreground">
              آخر قراءة: {formatTimestamp(result.asOf)} بتوقيت السعودية. النتائج تقديرية تشغيليًا عند وجود استنفاد غير مؤرخ.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {query.isLoading && <p className="text-sm">جاري تحميل بيانات الاشتراكات الحالية...</p>}
          {query.isError ? (
            <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm">
              <ShieldAlert className="mb-2 size-5 text-destructive" />
              تعذر تحميل بيانات التجديدات من Backend. قد لا يكون مسار القراءة الجديد منشورًا بعد، أو لا تملك صلاحية Superadmin.
              لم يتم عرض لقطة أكتوبر كبديل حتى لا تبدو بيانات قديمة كأنها حية.
            </div>
          ) : null}
          {result && (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {(["all", "overdue_14", "grace_14", "due_soon", "active", "review", "scheduled", "canceled"] as const).map((key) => (
                  <button key={key} type="button" onClick={() => { setStatus(key); setPage(1); }}
                    className={"rounded-xl border p-3 text-right transition-colors hover:border-primary/60 " +
                      (status === key ? "border-primary bg-primary/5" : "bg-card")}>
                    <span className="block text-xs text-muted-foreground">{STATUS_LABEL[key]}</span>
                    <span className="mt-1 block text-xl font-semibold tabular-nums">{number(result.totals[key] ?? 0)}</span>
                  </button>
                ))}
              </div>
              <form className="flex flex-wrap gap-2" onSubmit={(event) => {
                event.preventDefault(); setSearch(draftSearch.trim()); setPage(1);
              }}>
                <Input className="min-w-48 flex-1" aria-label="بحث باسم أو رقم جوال" placeholder="ابحث بالاسم أو رقم الجوال"
                  value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} maxLength={80} />
                <Button type="submit"><Search className="size-4" /> بحث</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setStatus("all"); setSearch(""); setDraftSearch(""); setPage(1);
                }}>مسح</Button>
              </form>
              <p className="text-xs leading-6 text-muted-foreground">
                حالة <strong>«يحتاج مراجعة»</strong> تعني أن الرصيد أو موعد النفاد غير محسوم؛ لا تتواصل بعرض استعادة قبل التحقق.
                الرصيد المعروض يشمل المتبقي والمحجوز، ولا يعني عدد وجبات مسلّمة.
              </p>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[830px] text-right text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3">العميل</th><th className="p-3">الحالة</th>
                      <th className="p-3">موعد الاستحقاق</th>
                      <th className="p-3">الرصيد</th><th className="p-3">آخر شراء</th><th className="p-3">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={row.userId} className="border-t">
                        <td className="p-3">
                          <p className="font-medium">{row.name || "بدون اسم مسجل"}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{row.phone || "غير متاح"}</p>
                        </td>
                        <td className="p-3"><Badge variant="outline">{STATUS_LABEL[row.status]}</Badge></td>
                        <td className="p-3">
                          {row.dueDate || "غير محدد"}
                          {row.dueDateIsLatestValidityBound && (
                            <p className="text-xs text-muted-foreground">حد الصلاحية المتوقع، قد ينفد الرصيد قبله</p>
                          )}
                        </td>
                        <td className="p-3">{row.remainingAndReserved === null ? "—" : number(row.remainingAndReserved)}</td>
                        <td className="p-3">{formatTimestamp(row.lastPurchaseAt)}</td>
                        <td className="p-3">
                          <Link className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                            to="/customer-management" search={{ userId: row.userId, panel: "profile" }}>
                            ملف العميل <ArrowLeft className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!result.rows.length && (
                      <tr><td className="p-4 text-muted-foreground" colSpan={6}>لا توجد نتائج لهذا البحث.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>نتائج البحث: {number(result.pagination.total)} | صفحة {number(result.pagination.page)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((n) => n - 1)}>السابق</Button>
                  <Button variant="outline" size="sm" disabled={page * result.pagination.pageSize >= result.pagination.total || query.isFetching} onClick={() => setPage((n) => n + 1)}>التالي</Button>
                </div>
              </div>
              {result.warnings.length > 0 && (
                <div className="rounded-xl bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
                  {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        عرض ومراجعة فقط؛ لا تُرسل رسائل تلقائية ولا يوجد هنا حقل موافقة تسويقية موثوق.
        يجب سؤال العميل عن سبب عدم التجديد وتوثيق الإجابة في نظام منفصل بعد اعتماد صلاحياته.
      </p>
    </section>
  );
}
