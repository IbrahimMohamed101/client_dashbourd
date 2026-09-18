import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Subscription, SubscriptionPurchase } from "@/types/subscriptionTypes";
import { isStackingPackageUsableNow } from "@/lib/subscriptionStackingPresentation";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  History,
  ReceiptText,
  WalletCards,
} from "lucide-react";

type Props = {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(amountHalala: number, currency = "SAR") {
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amountHalala || 0) / 100);
  } catch {
    return `${(Number(amountHalala || 0) / 100).toFixed(2)} ${currency}`;
  }
}

function statusLabel(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "نشط";
    case "paid_scheduled":
      return "مجدولة";
    case "exhausted":
      return "مستنفدة";
    case "expired":
    case "ended":
      return "منتهية";
    case "canceled":
      return "ملغى";
    case "pending":
    case "pending_payment":
      return "قيد الانتظار";
    default:
      return status || "غير محدد";
  }
}

function statusVariant(status: string | null | undefined) {
  if (status === "active") return "default" as const;
  if (status === "canceled") return "destructive" as const;
  if (status === "expired" || status === "ended" || status === "exhausted") return "secondary" as const;
  return "outline" as const;
}

function sourceLabel(sourceType: string | null | undefined, isLegacyPackage?: boolean) {
  if (isLegacyPackage) return "الباقة الأصلية";
  if (sourceType === "dashboard") return "شراء من لوحة التحكم";
  if (sourceType === "checkout") return "شراء من التطبيق";
  if (sourceType === "renewal") return "تجديد مدفوع";
  return "شراء إضافي";
}

function paymentMethodLabel(method: string | null | undefined) {
  switch (method) {
    case "cash":
      return "نقدي";
    case "visa":
      return "فيزا / بطاقة";
    case "moyasar":
      return "ميسر";
    default:
      return method || "غير محدد";
  }
}

function purchaseKey(purchase: SubscriptionPurchase, index: number) {
  return purchase.id
    || purchase.purchaseId
    || (purchase.displayId || "purchase") + "-" + index;
}

export function SubscriptionPurchaseHistoryDialog({
  subscription,
  open,
  onOpenChange,
}: Props) {
  if (!subscription) return null;

  const packages = subscription.stacking?.packages || [];
  const aggregate = subscription.stacking?.aggregateBalance;
  const purchaseCount = packages.length;
  const activeCount = packages.filter((purchase) => purchase.status === "active").length;
  const historicalCount = packages.filter((purchase) =>
    ["expired", "ended", "exhausted", "canceled"].includes(purchase.status || "")
  ).length;
  const title = purchaseCount > 1
    ? "سجل مشتريات الاشتراك"
    : "تفاصيل عملية الشراء";
  const orderedPackages = [...packages].sort((left, right) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[92vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b bg-muted/20 px-5 py-4 text-right sm:px-6">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg sm:text-xl">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="size-4" />
            </span>
            {title}
            <Badge variant="outline">{purchaseCount} باقات</Badge>
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-2xl leading-6">
            عرض تاريخي لكل عملية شراء مرتبطة بالحاوية التشغيلية. لا يتم تعديل أي رصيد أو بيانات من هذه النافذة.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-112px)] space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">المشتريات الكلية</p>
              <p className="mt-1 text-2xl font-black tabular-nums">{purchaseCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.045] p-3">
              <p className="text-[11px] text-muted-foreground">مشتريات نشطة</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">{activeCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[11px] text-muted-foreground">سجل تاريخي</p>
              <p className="mt-1 text-2xl font-black tabular-nums">{historicalCount}</p>
            </div>
          </div>
          {aggregate ? (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <WalletCards className="mt-0.5 size-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-black">إجمالي سجل الباقات</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    هذا هو الرصيد المجمع المسجل للحاوية التشغيلية. لا يعني ذلك أن كل رصيد ظاهر داخل باقة تاريخية قابل للاستهلاك من هذه الباقة نفسها.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الوجبات</p>
                <p className="mt-1 text-lg font-bold">{aggregate.totalMeals}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الرصيد المجمع المسجل</p>
                <p className="mt-1 text-lg font-bold">{aggregate.remainingMeals}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المستهلك</p>
                <p className="mt-1 text-lg font-bold">{aggregate.consumedMeals}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المحجوز</p>
                <p className="mt-1 text-lg font-bold">{aggregate.reservedMeals}</p>
              </div>
              </div>
            </div>
          ) : null}

          {orderedPackages.length ? (
            <div className="space-y-3">
              {orderedPackages.map((purchase, index) => {
                const usableNow = isStackingPackageUsableNow(purchase);
                const historical = ["expired", "ended", "exhausted", "canceled"].includes(purchase.status || "");

                return (
                <div
                  key={purchaseKey(purchase, index)}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {usableNow ? (
                          <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="size-4" />
                          </span>
                        ) : null}
                        <span className="font-black">
                          {purchase.displayId || "PUR-" + (index + 1)}
                        </span>
                        <Badge variant={usableNow ? "default" : statusVariant(purchase.status)}>
                          {usableNow && purchase.status === "paid_scheduled"
                            ? "نشط حاليًا"
                            : statusLabel(purchase.status)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{purchase.planName || "بدون اسم باقة"}</span>
                        <span aria-hidden>•</span>
                        <span>{sourceLabel(purchase.sourceType, purchase.isLegacyPackage)}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">تاريخ تسجيل السجل</p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(purchase.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-2">
                      <ReceiptText className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">رقم الشراء</p>
                        <p className="mt-1 text-sm font-semibold" dir="ltr">
                          {purchase.displayId || purchase.purchaseId || purchase.id || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <WalletCards className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {purchase.status === "active"
                            ? "الرصيد القابل للاستخدام الآن"
                            : "حالة الرصيد في هذه الباقة"}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {purchase.status === "active"
                            ? purchase.remainingMeals + " / " + purchase.totalMeals
                            : purchase.status === "expired" || purchase.status === "ended" || purchase.status === "exhausted" || purchase.status === "canceled"
                              ? "غير متاح للاستخدام"
                              : "غير متاح حاليًا"}
                        </p>
                        {!usableNow ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {historical
                              ? "المسجل تاريخيًا: " + purchase.remainingMeals + " من " + purchase.totalMeals + " وجبة"
                              : "لا يمكن استخدام رصيد هذه الباقة حتى تصبح نشطة."}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">الفترة</p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(purchase.effectiveStartDate || purchase.requestedStartDate)} — {formatDate(purchase.validityEndDate || purchase.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CreditCard className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">الدفع</p>
                        {purchase.payment ? (
                          <>
                            <p className="mt-1 text-sm font-semibold">
                              {formatMoney(purchase.payment.amountHalala, purchase.payment.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {paymentMethodLabel(purchase.payment.method)} · {formatDateTime(purchase.payment.paidAt)}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-sm font-medium text-muted-foreground">
                            لا يوجد دفع مرتبط مباشرة بهذه الباقة
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              لا توجد مشتريات مجزأة مرتبطة بهذا الاشتراك.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
