import { ArrowLeft, CalendarClock, ClipboardList, ShieldAlert, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RETENTION_OCT_2026 as snapshot, summarizeRetention } from "./retentionSnapshot";

const summary = summarizeRetention();
const number = (value: number) => new Intl.NumberFormat("ar-SA").format(value);
const percent = (value: number) => new Intl.NumberFormat("ar-SA", {
  style: "percent",
  maximumFractionDigits: 2,
}).format(value);

const categories = [
  { title: "جددوا في أكتوبر", count: snapshot.statuses.renewedOctober, detail: "11 مستحقين في أكتوبر + 5 عائدين من شهور سابقة" },
  { title: "ساري حتى نوفمبر", count: snapshot.statuses.expiresNovember, detail: "لا تصنفهم كعملاء فقدناهم" },
  { title: "انتهى في أكتوبر دون تجديد", count: snapshot.statuses.expiredInOctober, detail: "47 ما زالوا داخل مهلة 14 يومًا وقت القطع" },
  { title: "انتهى قبل أكتوبر دون عودة", count: snapshot.statuses.expiredBeforeOctober, detail: "مرشحون لاستطلاع أسباب عدم التجديد" },
  { title: "إلغاء حقيقي دون عودة", count: snapshot.statuses.canceledNoReturn, detail: "ليس ضمن 148 المنتهين دون تجديد" },
  { title: "حالة تحتاج مراجعة", count: snapshot.statuses.requiresReview, detail: "لا تضفها للمستحقين المؤكدين" },
] as const;

function Metric({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <Card className="rounded-2xl border-foreground/10">
      <CardContent className="space-y-2 p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tabular-nums">{number(value)}</p>
        <p className="text-xs leading-5 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

export function RetentionSnapshotPage({ onOpenProfile }: { onOpenProfile: () => void }) {
  return (
    <section className="space-y-5 pb-8" aria-label="تجديدات واحتفاظ العملاء" dir="rtl">
      <Card className="rounded-2xl border-foreground/10">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">متابعة تجديدات العملاء</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                لقطة تدقيق لأكتوبر، وليست بيانات حية أو قائمة متابعة عملاء محدثة.
              </p>
            </div>
            <Badge variant="outline">قراءة فقط — بيانات تاريخية</Badge>
          </div>
          <p className="text-sm text-muted-foreground">وقت القطع: {snapshot.cutoffLabel}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={onOpenProfile}>
            <UsersRound className="size-4" />
            فتح إدارة العملاء
          </Button>
          <a className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4" href={snapshot.source} target="_blank" rel="noopener noreferrer">
            تقرير التدقيق والمصادر <ArrowLeft className="size-4" />
          </a>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="عملاء قبل أكتوبر" value={snapshot.oldCustomers} note="يشمل حالتين للمراجعة، إحداهما تاريخية بلا دفع" />
        <Metric title="جددوا في أكتوبر" value={snapshot.renewedOctober} note="16 عميلًا نفذوا 17 عملية شراء" />
        <Metric title="استحقاق مستمر إلى نوفمبر" value={snapshot.statuses.expiresNovember} note="ليسوا ضمن العملاء المتوقفين" />
        <Metric title="انتهى ولم يجدد" value={summary.oldExpiredNoRepeat} note="65 انتهوا في أكتوبر + 83 قبل أكتوبر" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">أين الـ190 عميلًا القدامى؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((item) => (
              <div key={item.title} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="font-semibold tabular-nums">{number(item.count)}</span>
              </div>
            ))}
            <p className="border-t pt-3 text-sm text-muted-foreground">
              مجموع الفئات: {number(summary.classifiedTotal)} عميلًا، بدون تكرار.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">هل نسبة التجديد فعلاً 16 من 190؟</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">المستحقون المؤكدون في أكتوبر</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {number(snapshot.dueOldOctober)}
              </p>
              <p className="mt-2 text-sm">
                جدد {number(snapshot.dueOldRenewed)} منهم — نسبة مرصودة {percent(summary.renewalObservedRate)}.
              </p>
            </div>
            <p className="text-sm leading-7">
              الـ{number(snapshot.renewedOctober)} مجددًا: {number(snapshot.dueOldRenewed)} من مستحقي أكتوبر،
              و{number(snapshot.returnedAfterEarlierExpiry)} رجعوا بعد انتهاء أقدم.
            </p>
            <p className="text-sm text-muted-foreground">
              توجد حالة استحقاق واحدة غير محسومة. النسبة مرصودة حتى القطع وليست نسبة احتفاظ نهائية.
            </p>
            <div className="rounded-xl border p-3 text-sm">
              التجديد الأول: {number(snapshot.firstRenewal.renewed)} من أصل {number(snapshot.firstRenewal.dueOldNoPreviousRenewal)}
              {" "}مستحقًا لم يجددوا سابقًا ({percent(summary.firstRenewalObservedRate)}).
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">أولويات المتابعة بناءً على لقطة أكتوبر</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <ShieldAlert className="mb-2 size-5 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{number(summary.beyondGrace14NoRepeat)}</p>
            <p className="font-medium">خارج مهلة 14 يومًا</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">83 قبل أكتوبر + 18 أكملوا مهلة أكتوبر بلا تجديد. تحتاج مراجعة السبب والتواصل المصرح به.</p>
          </div>
          <div className="rounded-xl border p-4">
            <CalendarClock className="mb-2 size-5 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{number(summary.withinGrace14NoRepeat)}</p>
            <p className="font-medium">داخل مهلة التجديد</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">متابعة تجديد بدون تصنيفهم Lost. رقم تاريخي وقد يكون تغير لاحقًا.</p>
          </div>
          <div className="rounded-xl border p-4">
            <ClipboardList className="mb-2 size-5 text-muted-foreground" />
            <p className="text-2xl font-semibold tabular-nums">{number(snapshot.statuses.expiresNovember)}</p>
            <p className="font-medium">استباق موعد التجديد</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">كانوا مستمرين حتى نوفمبر عند القطع. يلزم تحديث حالتهم قبل التواصل.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">مهلة التجديد — لا تخلط بين Pending وLost</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[530px] text-right text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-3">المهلة</th>
                <th>نافذة مكتملة</th>
                <th>جددوا داخلها</th>
                <th>المعدل المكتمل</th>
                <th>لم يجددوا داخل مهلة غير مكتملة</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">7 أيام</td>
                <td>{number(snapshot.grace7.matured)}</td>
                <td>{number(snapshot.grace7.renewedWithinGrace)}</td>
                <td>{percent(snapshot.grace7.renewedWithinGrace / snapshot.grace7.matured)}</td>
                <td>{number(snapshot.grace7.pendingNoRenewal)}</td>
              </tr>
              <tr>
                <td className="py-3">14 يومًا</td>
                <td>{number(snapshot.grace14.matured)}</td>
                <td>{number(snapshot.grace14.renewedWithinGrace)}</td>
                <td>{percent(snapshot.grace14.renewedWithinGrace / snapshot.grace14.matured)}</td>
                <td>{number(snapshot.grace14.pendingNoRenewal)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            النوافذ المكتملة مختلفة في العدد؛ لا تعتبر تغير النسبة بين 7 و14 يومًا تحسنًا مؤكدًا.
            عميل جدد ثم انتهى استحقاقه مرة ثانية لا يصبح نشطًا تلقائيًا.
          </p>
        </CardContent>
      </Card>

      <p className="rounded-xl border border-dashed p-4 text-sm leading-7 text-muted-foreground">
        لمتابعة الحالة الحالية استخدم تبويب «متابعة التجديدات الحالية» المحمي بصلاحية Superadmin.
        لا تمثل هذه اللقطة موافقة على الرسائل. لا توجد قائمة أسماء أو أرقام
        جوالات في لقطة GitHub؛ هذه الصفحة لا ترسل رسائل، ولا تنشئ حملات، ولا تغيّر اشتراكًا.
      </p>
    </section>
  );
}
