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
import { useOneTimeOrderDetailQuery } from "@/hooks/useOneTimeOrdersQuery";
import {
  getOneTimeOrderStatusColor,
  getOneTimeOrderStatusLabel,
  isOneTimeOrderFinal,
} from "@/types/oneTimeOrderTypes";
import { displayLocalizedText, getStableEntityKey } from "@/utils/displayText";
import {
  ChefHat,
  Clock,
  CreditCard,
  MapPin,
  ReceiptText,
  Store,
  User,
} from "lucide-react";
import { OneTimeOrderPaymentBadge } from "./OneTimeOrderPaymentBadge";

interface OneTimeOrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string | number | null;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-left font-medium" dir={dir}>
        {value || "—"}
      </span>
    </div>
  );
}

function DetailSection({
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

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OneTimeOrderDetailDialog({
  orderId,
  open,
  onOpenChange,
}: OneTimeOrderDetailDialogProps) {
  const { data: detailRes, isLoading, isError } = useOneTimeOrderDetailQuery(
    orderId ?? ""
  );
  const order = detailRes?.data;
  const statusColor = order ? getOneTimeOrderStatusColor(order.status) : null;
  const isFinal = order ? isOneTimeOrderFinal(order.status) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-5xl"
        dir="rtl"
      >
        <div className="border-b bg-muted/30 px-5 py-4 sm:px-6">
          <DialogHeader className="gap-2 text-right">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between w-[95%]">
              <div className="space-y-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  تفاصيل الطلب
                </DialogTitle>
                <DialogDescription>
                  مراجعة بيانات العميل، الوجبات، الدفع، والاستلام بدون مغادرة القائمة.
                </DialogDescription>
              </div>
              {order && statusColor && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-purple-500/20 bg-purple-500/10 text-purple-600">
                    <Store className="ml-1 h-3 w-3" />
                    استلام من الفرع
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} gap-1.5 px-3 py-1.5`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${statusColor.dot} ${
                        !isFinal ? "animate-pulse" : ""
                      }`}
                    />
                    {getOneTimeOrderStatusLabel(order.status)}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(92vh-112px)] overflow-y-auto px-5 py-5 sm:px-6">
          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : isError || !order ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <ReceiptText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">تعذر تحميل تفاصيل الطلب</p>
              <p className="mt-1 text-sm text-muted-foreground">
                أغلق النافذة وحاول فتح التفاصيل مرة أخرى.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow label="رقم الطلب" value={order.orderNumber || order.entityId} dir="ltr" />
                <DetailRow label="تاريخ الإنشاء" value={formatDateTime(order.createdAt)} />
                <DetailRow label="آخر تحديث" value={formatDateTime(order.updatedAt)} />
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">حالة الدفع</span>
                  <OneTimeOrderPaymentBadge status={order.payment?.status ?? "initiated"} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4">
                  <DetailSection
                    title="العميل"
                    icon={<User className="h-4 w-4 text-primary" />}
                  >
                    <DetailRow label="الاسم" value={order.customer?.name} />
                    <DetailRow label="الهاتف" value={order.customer?.phone} dir="ltr" />
                    <DetailRow label="البريد" value={order.customer?.email} dir="ltr" />
                  </DetailSection>

                  <DetailSection
                    title="الاستلام"
                    icon={<MapPin className="h-4 w-4 text-primary" />}
                  >
                    <DetailRow
                      label="الفرع"
                      value={displayLocalizedText(
                        order.pickup?.branchName,
                        order.pickup?.branchId || "—"
                      )}
                    />
                    <DetailRow label="الوقت" value={order.pickup?.window} />
                    <DetailRow label="رمز الاستلام" value={order.pickup?.pickupCode} dir="ltr" />
                  </DetailSection>

                  <DetailSection
                    title="الدفع"
                    icon={<CreditCard className="h-4 w-4 text-primary" />}
                  >
                    <DetailRow label="الطريقة" value={order.payment?.method} />
                    <DetailRow label="المزود" value={order.payment?.provider} />
                    <DetailRow label="المرجع" value={order.payment?.reference} dir="ltr" />
                    <DetailRow label="وقت الدفع" value={formatDateTime(order.payment?.paidAt)} />
                  </DetailSection>
                </div>

                <div className="space-y-4 lg:col-span-2">
                  <DetailSection
                    title="عناصر الطلب"
                    icon={<ChefHat className="h-4 w-4 text-primary" />}
                  >
                    {order.items?.length ? (
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={getStableEntityKey(item, "one-time-order-dialog-item", index)}
                            className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium">
                                {displayLocalizedText(item.name, "وجبة")}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground">
                                  ملاحظة: {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-3 text-sm">
                              <Badge variant="secondary">x{item.quantity}</Badge>
                              {item.unitPrice != null && (
                                <span className="font-medium">{item.unitPrice}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        لا توجد عناصر مسجلة لهذا الطلب.
                      </p>
                    )}
                  </DetailSection>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <DetailSection
                      title="المبالغ"
                      icon={<ReceiptText className="h-4 w-4 text-primary" />}
                    >
                      <DetailRow label="المجموع الفرعي" value={order.pricing?.subtotal} />
                      <DetailRow label="الخصم" value={order.pricing?.discount} />
                      <DetailRow label="الضريبة" value={order.pricing?.vat} />
                      <Separator />
                      <DetailRow
                        label="الإجمالي"
                        value={
                          order.pricing?.total != null
                            ? `${order.pricing.total} ${order.pricing.currency || ""}`
                            : undefined
                        }
                      />
                    </DetailSection>

                    <DetailSection
                      title="سجل النشاط"
                      icon={<Clock className="h-4 w-4 text-primary" />}
                    >
                      {order.activity?.length ? (
                        <div className="space-y-3">
                          {order.activity.slice(0, 5).map((entry, index) => (
                            <div
                              key={`${entry.timestamp}-${entry.action}-${index}`}
                              className="border-r-2 border-primary/30 pr-3"
                            >
                              <p className="text-sm font-medium">{entry.action}</p>
                              {(entry.fromStatus || entry.toStatus) && (
                                <p className="text-xs text-muted-foreground">
                                  {entry.fromStatus || "—"} ← {entry.toStatus || "—"}
                                </p>
                              )}
                              {entry.reason && (
                                <p className="text-xs text-muted-foreground">
                                  السبب: {entry.reason}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground" dir="ltr">
                                {formatDateTime(entry.timestamp)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          لا يوجد نشاط مسجل بعد.
                        </p>
                      )}
                    </DetailSection>
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
