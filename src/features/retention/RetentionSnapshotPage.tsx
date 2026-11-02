import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CalendarClock, ClipboardList, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RETENTION_OCT_2026 as snapshot, summarizeRetention } from "./retentionSnapshot";

const summary = summarizeRetention();
const number = (value: number) => new Intl.NumberFormat("en-GB").format(value);
const percent = (value: number) => new Intl.NumberFormat("ar-EG-u-nu-latn", {
  style: "percent", maximumFractionDigits: 2,
}).format(value);
const categories = [
  { title: "جددوا خلال أكتوبر", count: snapshot.statuses.renewedOctober, color: "bg-emerald-600", detail: "11 من مستحقي أكتوبر و5 عائدين" },
  { title: "ساري حتى نوفمبر", count: snapshot.statuses.expiresNovember, color: "bg-blue-500", detail: "لم ينتهِ وقت القطع" },
  { title: "انتهى في أكتوبر دون تجديد", count: snapshot.statuses.expiredInOctober, color: "bg-amber-500", detail: "بعضهم كان داخل المهلة" },
  { title: "انتهى قبل أكتوبر ولم يعد", count: snapshot.statuses.expiredBeforeOctober, color: "bg-rose-500", detail: "انتهى قبل الفترة" },
  { title: "ملغي دون عودة", count: snapshot.statuses.canceledNoReturn, color: "bg-slate-400", detail: "إلغاء موثق" },
  { title: "حالة غير محسومة", count: snapshot.statuses.requiresReview, color: "bg-orange-500", detail: "لا تُحسب كفاقد مؤكد" },
] as const;
const priorities = [
  { title: "خارج مهلة 14 يومًا", count: summary.beyondGrace14NoRepeat, filter: "overdue_14" as const, note: "الأرقام التاريخية لا تعني أن نفس العملاء في الحالة الحالية.", icon: AlertTriangle },
  { title: "داخل مهلة 14 يومًا", count: summary.withinGrace14NoRepeat, filter: "grace_14" as const, note: "تحقق من الاستحقاق والرصيد الحالي قبل التواصل.", icon: CalendarClock },
  { title: "استحقاق مستمر حتى نوفمبر", count: snapshot.statuses.expiresNovember, filter: "due_soon" as const, note: "قد تتغير حالتهم منذ قطع التقرير.", icon: ClipboardList },
];

export function RetentionSnapshotPage() {
  const mainRate = snapshot.renewedOctober / snapshot.oldCustomers;
  return (
    <section className="space-y-5 pb-8" aria-label="تقرير أكتوبر 2026" dir="rtl">
      <div role="note" className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        <strong>تقرير تاريخي — أكتوبر 2026.</strong> أُغلقت البيانات في {snapshot.cutoffLabel}.
        لا تستخدم أرقام التقرير لتحديد حالة عميل اليوم؛ افتح حالة التجديد الحالية عند الحاجة.
      </div>
      <Card className="rounded-2xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">تقرير تجديد العملاء</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">فترة التقرير: أكتوبر 2026 · لقطة معتمدة لا تتغير تلقائيًا</p>
            </div>
            <label className="text-sm">الفترة
              <select disabled title="تتوفر لقطة أكتوبر 2026 فقط حاليًا" className="mr-2 rounded-md border bg-muted px-3 py-2">
                <option>أكتوبر 2026 (تاريخي)</option>
              </select>
            </label>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline"><Link to="/customer-management" search={{ retentionStatus: "all" }}>
            <UsersRound className="size-4" /> عرض الحالة الحالية <ArrowLeft className="size-4" />
          </Link></Button>
          <a href={snapshot.source} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline">مصدر الأرقام وتفاصيل التدقيق</a>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <p className="text-sm font-semibold">نسبة التجديد والعودة خلال أكتوبر</p>
            <p className="mt-2 text-4xl font-bold tabular-nums">{percent(mainRate)}</p>
            <p className="mt-2 text-sm text-muted-foreground">جدد أو عاد {number(snapshot.renewedOctober)} من أصل {number(snapshot.oldCustomers)} عميلًا مسجلًا قبل أكتوبر.</p>
            <p className="mt-1 text-xs text-muted-foreground">تعريف هذه النسبة: المجددون والعائدون خلال الشهر ÷ جميع العملاء السابقين، وليست نسبة المستحقين وحدهم.</p>
          </CardContent>
        </Card>
        {[
          ["عملاء قبل أكتوبر", snapshot.oldCustomers, "المقام الثابت للمؤشر الرئيسي"],
          ["جددوا أو عادوا", snapshot.renewedOctober, "11 مستحقين + 5 عائدين"],
          ["ساري حتى نوفمبر", snapshot.statuses.expiresNovember, "بحسب تاريخ القطع فقط"],
        ].map(([label, value, hint]) => (
          <Card key={String(label)}><CardContent className="space-y-2 p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tabular-nums">{number(Number(value))}</p>
            <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">توزيع {number(snapshot.oldCustomers)} عميلًا عند قطع التقرير</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div role="img" aria-label="توزيع العملاء حسب حالة أكتوبر" className="flex h-8 overflow-hidden rounded-lg" dir="ltr">
            {categories.map((item) => <div key={item.title} className={item.color}
              style={{ width: (100 * item.count / snapshot.oldCustomers) + "%" }} title={item.title + ": " + number(item.count)} />)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((item) => (
              <div key={item.title} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <span className={"mt-1 inline-block size-3 shrink-0 rounded-sm " + item.color} />
                  <div className="min-w-0 flex-1"><p className="font-semibold text-[13px]">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div>
                  <strong className="text-xl tabular-nums">{number(item.count)}</strong>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-muted-foreground">مجموع الفئات المتنافية: {number(summary.classifiedTotal)} عميلًا.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">أولويات المتابعة التاريخية</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {priorities.map(({ title, count, filter, note, icon: Icon }) => (
            <Link key={filter} to="/customer-management" search={{ retentionStatus: filter }}
              className="rounded-xl border p-4 transition-colors hover:border-primary hover:bg-muted/30">
              <Icon className="mb-2 size-5 text-muted-foreground" />
              <p className="text-2xl font-bold tabular-nums">{number(count)}</p>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
              <p className="mt-2 text-[13px] font-medium text-primary">فتح نفس الفلتر بالبيانات الحالية</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-semibold">تفاصيل المعدلات حسب نافذة التجديد (مقامات مختلفة)</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[580px] text-right text-sm">
            <thead className="border-b bg-muted/50"><tr>
              <th className="p-3">المؤشر</th><th>المقام</th><th>المجددون</th><th>النسبة</th>
            </tr></thead>
            <tbody>
              <tr className="border-b"><td className="p-3">المستحقون في أكتوبر</td><td>{number(snapshot.dueOldOctober)}</td><td>{number(snapshot.dueOldRenewed)}</td><td>{percent(summary.renewalObservedRate)}</td></tr>
              <tr className="border-b"><td className="p-3">التجديد الأول</td><td>{number(snapshot.firstRenewal.dueOldNoPreviousRenewal)}</td><td>{number(snapshot.firstRenewal.renewed)}</td><td>{percent(summary.firstRenewalObservedRate)}</td></tr>
              <tr className="border-b"><td className="p-3">مهلة مكتملة: 7 أيام</td><td>{number(snapshot.grace7.matured)}</td><td>{number(snapshot.grace7.renewedWithinGrace)}</td><td>{percent(snapshot.grace7.renewedWithinGrace / snapshot.grace7.matured)}</td></tr>
              <tr><td className="p-3">مهلة مكتملة: 14 يومًا</td><td>{number(snapshot.grace14.matured)}</td><td>{number(snapshot.grace14.renewedWithinGrace)}</td><td>{percent(snapshot.grace14.renewedWithinGrace / snapshot.grace14.matured)}</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">هذه المقامات تختلف عن إجمالي العملاء السابقين. لا تُقارن النسب كأنها قياس واحد. توجد حالة استحقاق غير محسومة.</p>
        </div>
      </details>
    </section>
  );
}
