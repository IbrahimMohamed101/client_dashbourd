import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Subscription } from "@/types/subscriptionTypes";
import {
  currentStackingAggregateBalance,
  isStackingPackageUsableNow,
} from "@/lib/subscriptionStackingPresentation";
import type {
  SubscriptionStackingPackage,
  SubscriptionStackingPayment,
} from "@/types/subscriptionStackingTypes";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  History,
  Layers3,
  WalletCards,
} from "lucide-react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
}

function formatMoney(payment: SubscriptionStackingPayment) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: payment.currency || "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(payment.amountHalala || 0) / 100);
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "active":
      return "نشطة الآن";
    case "paid_scheduled":
      return "مجدولة";
    case "exhausted":
      return "مستنفدة";
    case "expired":
      return "منتهية";
    case "canceled":
      return "ملغاة";
    default:
      return status || "غير محددة";
  }
}

function statusTone(status?: string | null) {
  switch (status) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "paid_scheduled":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "exhausted":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "expired":
      return "border-border bg-muted text-muted-foreground";
    case "canceled":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function sourceLabel(item: SubscriptionStackingPackage) {
  if (item.isLegacyPackage) return "الباقة الأصلية";
  if (item.sourceType === "renewal") return "تجديد مدفوع";
  if (item.sourceType === "dashboard") return "شراء من لوحة التحكم";
  if (item.sourceType === "checkout") return "شراء من التطبيق";
  return "شراء إضافي";
}

function paymentMethodLabel(method?: string | null) {
  switch (method) {
    case "cash":
      return "كاش";
    case "visa":
      return "بطاقة";
    case "moyasar":
      return "ميسر";
    default:
      return method || "دفع";
  }
}

function PackageCard({ item }: { item: SubscriptionStackingPackage }) {
  const isUsableNow = isStackingPackageUsableNow(item);
  const isActive = isUsableNow;
  const isHistorical = item.status === "expired" || item.status === "exhausted" || item.status === "canceled";

  return (
    <article
      className={[
        "rounded-2xl border p-4 shadow-sm transition",
        isActive
          ? "border-emerald-500/40 bg-emerald-500/[0.045] shadow-emerald-500/5"
          : "bg-card",
        isHistorical ? "opacity-[0.92]" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold">
                {item.planName || "باقة محفوظة"}
              </h3>
              {item.displayId ? (
                <Badge variant="outline" className="font-mono text-[10px]" dir="ltr">
                  {item.displayId}
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{sourceLabel(item)}</span>
              <span aria-hidden>•</span>
              <span>{item.daysCount} أيام</span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={statusTone(item.status)}
          >
            {isActive ? <CheckCircle2 className="ml-1 h-3.5 w-3.5" /> : null}
            {statusLabel(item.status)}
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border bg-background/75 px-3 py-3">
            <p className="text-[11px] text-muted-foreground">
              {isUsableNow ? "الرصيد القابل للاستخدام الآن" : "حالة الرصيد في هذه الباقة"}
            </p>
            <p className="mt-1 text-lg font-black tabular-nums">
              {isUsableNow ? (
                <>
                  {item.remainingMeals}
                  <span className="mx-1 text-sm font-normal text-muted-foreground">/</span>
                  {item.totalMeals}
                </>
              ) : (
                <span className="text-base">{isHistorical ? "غير متاح للاستخدام" : "غير متاح حاليًا"}</span>
              )}
            </p>
            {!isUsableNow ? (
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                {isHistorical
                  ? "المسجل تاريخيًا: " + item.remainingMeals + " من " + item.totalMeals + " وجبة"
                  : "لا يمكن استخدام رصيد هذه الباقة حتى تصبح نشطة."}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border bg-background/75 px-3 py-3">
            <p className="text-[11px] text-muted-foreground">الجرامات</p>
            <p className="mt-1 text-lg font-black tabular-nums">{item.proteinGrams}g</p>
          </div>
          <div className="rounded-xl border bg-background/75 px-3 py-3">
            <p className="text-[11px] text-muted-foreground">يوميًا</p>
            <p className="mt-1 text-lg font-black tabular-nums">{item.mealsPerDay}</p>
          </div>
          <div className="rounded-xl border bg-background/75 px-3 py-3">
            <p className="text-[11px] text-muted-foreground">تاريخ البداية</p>
            <p className="mt-1 text-sm font-bold">{formatDate(item.effectiveStartDate || item.requestedStartDate)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {formatDate(item.effectiveStartDate || item.requestedStartDate)}
              <span className="mx-1">—</span>
              {formatDate(item.validityEndDate || item.endDate)}
            </span>
          </div>

          {item.payment ? (
            <div className="flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">
                {formatMoney(item.payment)}
              </span>
              <span>· {paymentMethodLabel(item.payment.method)}</span>
            </div>
          ) : (
            <span>لا يوجد دفع مرتبط مباشرة بهذه الباقة</span>
          )}
        </div>
      </div>
    </article>
  );
}

function TransactionRow({ payment }: { payment: SubscriptionStackingPayment }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background/75 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{formatMoney(payment)}</span>
          <Badge variant="secondary">
            {paymentMethodLabel(payment.method)}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {payment.paidAt || payment.createdAt
            ? formatDate(payment.paidAt || payment.createdAt)
            : "التاريخ غير متاح"}
          {payment.providerReference ? (
            <span dir="ltr"> · {payment.providerReference}</span>
          ) : null}
        </p>
      </div>

      <Badge variant={payment.status === "paid" ? "default" : "outline"}>
        {payment.status === "paid" ? "مدفوع" : payment.status || "غير محدد"}
      </Badge>
    </div>
  );
}

export function SubscriptionStackingOverview({
  subscription,
  compact = false,
}: {
  subscription: Subscription;
  compact?: boolean;
}) {
  const stacking = subscription.stacking;
  if (!stacking?.hasEntitlementBatches) return null;

  const activePackages = stacking.packages.filter((item) => item.status === "active");
  const scheduledPackages = stacking.packages.filter((item) => item.status === "paid_scheduled");
  const historicalPackages = stacking.packages.filter((item) =>
    item.status === "expired" || item.status === "exhausted" || item.status === "canceled"
  );

  const aggregateMeals = currentStackingAggregateBalance(subscription) || stacking.aggregateBalance;
  const orderedPackages = [...stacking.packages].sort((left, right) => {
    const rank = (status: string | null) =>
      status === "active" ? 0 : status === "paid_scheduled" ? 1 : 2;
    const statusOrder = rank(left.status) - rank(right.status);
    if (statusOrder !== 0) return statusOrder;
    const leftDate = Date.parse(left.effectiveStartDate || left.requestedStartDate || "");
    const rightDate = Date.parse(right.effectiveStartDate || right.requestedStartDate || "");
    return Number.isFinite(leftDate) && Number.isFinite(rightDate)
      ? rightDate - leftDate
      : 0;
  });

  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
      <CardHeader className={compact ? "border-b bg-muted/20 p-4" : "border-b bg-muted/20"}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers3 className="h-4 w-4" />
              </span>
              سجل الباقات والرصيد التشغيلي
              <Badge variant="outline">{stacking.packageCount} باقات</Badge>
            </CardTitle>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              الاشتراك هنا حاوية تشغيلية تجمع عمليات الشراء المرتبطة بها. كل شراء يحتفظ برقمه وفترته وحالته وطريقة دفعه.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:min-w-[330px]">
            <div className="rounded-xl border bg-background px-3 py-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">نشطة</p>
              <p className="mt-1 text-xl font-black tabular-nums">{activePackages.length}</p>
            </div>
            <div className="rounded-xl border bg-background px-3 py-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">مجدولة</p>
              <p className="mt-1 text-xl font-black tabular-nums">{scheduledPackages.length}</p>
            </div>
            <div className="rounded-xl border bg-background px-3 py-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">تاريخية</p>
              <p className="mt-1 text-xl font-black tabular-nums">{historicalPackages.length}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? "space-y-4 p-4" : "space-y-5"}>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-bold">ملخص سجل المشتريات</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                هذا هو الرصيد المجمع المسجل للحاوية التشغيلية. لا يعني ذلك أن كل رصيد ظاهر داخل باقة تاريخية قابل للاستهلاك من هذه الباقة نفسها.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border bg-background/80 p-3">
              <p className="text-[11px] text-muted-foreground">إجمالي الوجبات</p>
              <p className="mt-1 text-xl font-black tabular-nums">{aggregateMeals.totalMeals}</p>
            </div>
            <div className="rounded-xl border bg-background/80 p-3">
              <p className="text-[11px] text-muted-foreground">الرصيد المجمع المسجل</p>
              <p className="mt-1 text-xl font-black tabular-nums">{aggregateMeals.remainingMeals}</p>
            </div>
            <div className="rounded-xl border bg-background/80 p-3">
              <p className="text-[11px] text-muted-foreground">مستهلك</p>
              <p className="mt-1 text-xl font-black tabular-nums">{aggregateMeals.consumedMeals}</p>
            </div>
            <div className="rounded-xl border bg-background/80 p-3">
              <p className="text-[11px] text-muted-foreground">محجوز</p>
              <p className="mt-1 text-xl font-black tabular-nums">{aggregateMeals.reservedMeals}</p>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black">الباقات المرتبطة</h3>
              <p className="text-xs text-muted-foreground">الباقة النشطة أولًا، ثم المجدولة، ثم السجل التاريخي.</p>
            </div>
            <Badge variant="secondary">{stacking.packages.length} باقة</Badge>
          </div>

          <div className="space-y-3">
            {orderedPackages.map((item) => (
              <PackageCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {stacking.transactions.length > 0 ? (
          <section className="border-t pt-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <div>
                <h3 className="font-black">سجل عمليات الدفع</h3>
                <p className="text-xs text-muted-foreground">
                  عمليات الدفع المرتبطة مباشرة بالباقات المعروضة.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {stacking.transactions.map((payment) => (
                <TransactionRow key={payment.id} payment={payment} />
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
