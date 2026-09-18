import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Subscription, SubscriptionPurchase } from "@/types/subscriptionTypes";
import { CalendarDays, CreditCard, ReceiptText, WalletCards } from "lucide-react";

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
    case "expired":
    case "ended":
      return "منتهي";
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
  if (status === "expired" || status === "ended") return "secondary" as const;
  return "outline" as const;
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
  const title = purchaseCount > 1
    ? "سجل مشتريات الاشتراك"
    : "تفاصيل عملية الشراء";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            جميع عمليات الشراء المرتبطة بهذا الاشتراك التشغيلي، بدون تغيير أي بيانات أو أرصدة.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">المشترك</p>
              <p className="mt-1 font-semibold">{subscription.userName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الاشتراك</p>
              <p className="mt-1 font-semibold">{subscription.displayId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">عدد المشتريات</p>
              <p className="mt-1 font-semibold">{purchaseCount || 1}</p>
            </div>
          </div>

          {aggregate ? (
            <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الوجبات</p>
                <p className="mt-1 text-lg font-bold">{aggregate.totalMeals}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المتبقي</p>
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
          ) : null}

          {packages.length ? (
            <div className="space-y-3">
              {packages.map((purchase, index) => (
                <div
                  key={purchaseKey(purchase, index)}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">
                          {purchase.displayId || "PUR-" + (index + 1)}
                        </span>
                        <Badge variant={statusVariant(purchase.status)}>
                          {statusLabel(purchase.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {purchase.planName || "بدون اسم باقة"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
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
                        <p className="text-xs text-muted-foreground">الوجبات</p>
                        <p className="mt-1 text-sm font-semibold">
                          {purchase.remainingMeals} / {purchase.totalMeals}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">الفترة</p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(purchase.requestedStartDate)} — {formatDate(purchase.endDate)}
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
                            لا توجد عملية دفع مرتبطة
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
