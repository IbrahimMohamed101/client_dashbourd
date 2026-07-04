import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionDetailsQuery } from "@/hooks/useSubscriptionsQuery";
import type {
  AddonSummaryItem,
  PremiumSummaryItem,
  Subscription,
} from "@/types/subscriptionTypes";
import {
  CalendarDays,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Sparkles,
  User,
  Utensils,
} from "lucide-react";

interface SubscriptionQuickViewDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status?: string) {
  switch (status) {
    case "active":
      return "نشط";
    case "pending":
      return "قيد الانتظار";
    case "canceled":
      return "ملغى";
    case "expired":
      return "منتهي";
    case "ended":
      return "انتهى";
    default:
      return status || "غير محدد";
  }
}

function statusClass(status?: string) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600";
    case "canceled":
      return "border-red-500/20 bg-red-500/10 text-red-600";
    case "expired":
    case "ended":
      return "border-muted-foreground/20 bg-muted text-muted-foreground";
    default:
      return "border-primary/20 bg-primary/10 text-primary";
  }
}

function deliveryModeLabel(mode?: string) {
  if (mode === "delivery") return "توصيل";
  if (mode === "pickup") return "استلام";
  return mode || "";
}

function addressSummary(subscription: Subscription) {
  const address = subscription.deliveryAddress;
  if (!address) return "";

  return [
    address.line1,
    address.building,
    address.street,
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join("، ");
}

function DetailRow({
  label,
  value,
  dir,
}: {
  label: string;
  value?: ReactNode;
  dir?: "rtl" | "ltr";
}) {
  if (!hasValue(value)) return null;

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-left font-medium" dir={dir}>
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        <Separator />
        {children}
      </CardContent>
    </Card>
  );
}

function QuantityBadge({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) {
  if (!hasValue(value)) return null;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

export function SubscriptionQuickViewDialog({
  subscription,
  open,
  onOpenChange,
}: SubscriptionQuickViewDialogProps) {
  const subscriptionId = subscription?._id ?? "";
  const { data: detailResponse, isLoading, isError } =
    useSubscriptionDetailsQuery(subscriptionId);
  const details = detailResponse?.data ?? subscription;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-5xl"
        dir="rtl"
      >
        <div className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <DialogHeader className="gap-2 text-right">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  تفاصيل الاشتراك
                </DialogTitle>
                <DialogDescription>
                  عرض سريع لأهم بيانات الاشتراك بدون مغادرة القائمة.
                </DialogDescription>
              </div>
              {details && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusClass(details.status)}>
                    {statusLabel(details.status)}
                  </Badge>
                  <Badge variant="secondary">
                    {details.displayId || details.id || details._id}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-112px)] overflow-y-auto px-5 py-5 sm:px-6">
          {isLoading && !details ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : isError || !details ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <ReceiptText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">تعذر تحميل تفاصيل الاشتراك</p>
              <p className="mt-1 text-sm text-muted-foreground">
                أغلق النافذة وحاول فتح التفاصيل مرة أخرى.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow label="المرجع" value={details.displayId || details.id} dir="ltr" />
                <DetailRow label="الباقة" value={details.planName || details.plan?.name} />
                <DetailRow label="بداية الاشتراك" value={formatDate(details.startDate)} />
                <DetailRow label="نهاية الاشتراك" value={formatDate(details.endDate)} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4">
                  <Section
                    title="العميل"
                    icon={<User className="h-4 w-4 text-primary" />}
                  >
                    <DetailRow
                      label="الاسم"
                      value={details.user?.fullName || details.userName}
                    />
                    <DetailRow
                      label="الهاتف"
                      value={details.user?.phone}
                      dir="ltr"
                    />
                    <DetailRow
                      label="البريد"
                      value={details.user?.email}
                      dir="ltr"
                    />
                  </Section>

                  <Section
                    title="الخطة"
                    icon={<Package className="h-4 w-4 text-primary" />}
                  >
                    <DetailRow label="الباقة" value={details.planName || details.plan?.name} />
                    <DetailRow label="الجرامات" value={details.selectedGrams ? `${details.selectedGrams}g` : ""} />
                    <DetailRow label="وجبات في اليوم" value={details.selectedMealsPerDay} />
                    <DetailRow label="نهاية الصلاحية" value={formatDate(details.validityEndDate)} />
                  </Section>

                  <Section
                    title="التواصل"
                    icon={<Phone className="h-4 w-4 text-primary" />}
                  >
                    <DetailRow label="رقم الجوال" value={details.user?.phone} dir="ltr" />
                    <DetailRow label="حالة العميل" value={details.user?.isActive === false ? "غير نشط" : "نشط"} />
                  </Section>
                </div>

                <div className="space-y-4 lg:col-span-2">
                  <Section
                    title="رصيد الوجبات"
                    icon={<Utensils className="h-4 w-4 text-primary" />}
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <QuantityBadge label="المتبقي" value={details.remainingMeals} />
                      <QuantityBadge label="الإجمالي" value={details.totalMeals} />
                      <QuantityBadge label="العادية" value={details.remainingRegularMeals} />
                      <QuantityBadge label="المميزة" value={details.remainingPremiumMeals ?? details.premiumRemaining} />
                    </div>
                  </Section>

                  <Section
                    title="التوصيل أو الاستلام"
                    icon={<MapPin className="h-4 w-4 text-primary" />}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailRow label="الطريقة" value={deliveryModeLabel(details.deliveryMode || details.fulfillmentMethod)} />
                      <DetailRow label="المنطقة" value={details.deliveryZoneName || details.deliveryAddress?.district} />
                      <DetailRow label="الوقت" value={details.deliverySlot?.window || details.deliveryWindow} />
                      <DetailRow label="العنوان" value={addressSummary(details)} />
                      <DetailRow label="ملاحظات العنوان" value={details.deliveryAddress?.notes} />
                    </div>
                  </Section>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Section
                      title="الإضافات"
                      icon={<Sparkles className="h-4 w-4 text-primary" />}
                    >
                      {details.addonsSummary?.length ? (
                        <div className="space-y-2">
                          {details.addonsSummary
                            .slice(0, 5)
                            .map((addon: AddonSummaryItem) => (
                            <div
                              key={addon.addonId}
                              className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                            >
                              <span className="font-medium">{addon.name}</span>
                              <span className="text-muted-foreground">
                                {addon.remainingQtyTotal}/{addon.purchasedQtyTotal}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          لا توجد إضافات نشطة.
                        </p>
                      )}
                    </Section>

                    <Section
                      title="الوجبات المميزة"
                      icon={<CalendarDays className="h-4 w-4 text-primary" />}
                    >
                      {details.premiumSummary?.length ? (
                        <div className="space-y-2">
                          {details.premiumSummary
                            .slice(0, 5)
                            .map((premium: PremiumSummaryItem, index: number) => (
                            <div
                              key={`${premium.premiumMealId ?? "premium"}-${index}`}
                              className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                            >
                              <span className="font-medium">{premium.name}</span>
                              <span className="text-muted-foreground">
                                {premium.remainingQtyTotal}/{premium.purchasedQtyTotal}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          لا توجد وجبات مميزة نشطة.
                        </p>
                      )}
                    </Section>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
