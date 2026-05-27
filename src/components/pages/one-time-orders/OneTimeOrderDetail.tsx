import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  MapPin,
  PackageCheck,
  Play,
  Store,
  User,
  XCircle,
} from "lucide-react";
import {
  useOneTimeOrderDetailQuery,
  useOneTimeOrderActionMutation,
} from "@/hooks/useOneTimeOrdersQuery";
import {
  getOneTimeOrderStatusLabel,
  getOneTimeOrderStatusColor,
  isOneTimeOrderFinal,
  isUnsupportedOneTimeOrderAction,
} from "@/types/oneTimeOrderTypes";
import type { OneTimeOrderAction, OneTimeOrderActionRequest } from "@/types/oneTimeOrderTypes";

interface OneTimeOrderDetailProps {
  orderId: string;
}

export const OneTimeOrderDetail: React.FC<OneTimeOrderDetailProps> = ({
  orderId,
}) => {
  const navigate = useNavigate();
  const { data: detailRes, isLoading } = useOneTimeOrderDetailQuery(orderId);
  const actionMutation = useOneTimeOrderActionMutation();

  const [confirmDialog, setConfirmDialog] = useState<{
    action: OneTimeOrderAction;
  } | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const order = detailRes?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16" dir="rtl">
        <h2 className="text-xl font-bold text-foreground">الطلب غير موجود</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/one-time-orders" })}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للقائمة
        </Button>
      </div>
    );
  }

  const statusColor = getOneTimeOrderStatusColor(order.status);
  const isFinal = isOneTimeOrderFinal(order.status);
  const isNonOperational = order.payment?.status !== "paid" || order.status === "pending_payment";

  const handleAction = (action: OneTimeOrderAction) => {
    if (isUnsupportedOneTimeOrderAction(action)) return;
    if (action === "prepare" && isNonOperational) return;

    if (action === "fulfill" || action === "cancel") {
      setConfirmDialog({
        action,
      });
    } else {
      actionMutation.mutate({ orderId: order.entityId, action });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;
    const body: OneTimeOrderActionRequest = {};
    if (confirmDialog.action === "cancel" && cancelReason) {
      body.reason = cancelReason;
    }
    actionMutation.mutate({ orderId: order.entityId, action: confirmDialog.action, body });
    setConfirmDialog(null);
    setCancelReason("");
  };

  const getActionConfig = (action: OneTimeOrderAction) => {
    switch (action) {
      case "prepare":
        return { label: "بدء التحضير", icon: <Play className="ml-1.5 h-4 w-4" />, variant: "default" as const };
      case "ready_for_pickup":
        return { label: "جاهز للاستلام", icon: <PackageCheck className="ml-1.5 h-4 w-4" />, variant: "secondary" as const };
      case "fulfill":
        return { label: "تم الاستلام", icon: <CheckCircle2 className="ml-1.5 h-4 w-4" />, variant: "default" as const };
      case "cancel":
        return { label: "إلغاء الطلب", icon: <XCircle className="ml-1.5 h-4 w-4" />, variant: "destructive" as const };
      default:
        return { label: action, icon: null, variant: "secondary" as const };
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/one-time-orders" })}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              طلب لمرة واحدة
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                <Store className="ml-1 h-3 w-3" />
                استلام من الفرع
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {order.orderNumber || order.entityId}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} inline-flex items-center gap-1.5 px-3 py-1.5 text-sm`}
        >
          <span className={`h-2 w-2 rounded-full ${statusColor.dot} ${!isFinal ? "animate-pulse" : ""}`} />
          {getOneTimeOrderStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Customer + Pickup + Payment */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Customer info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الاسم</span>
                <span className="font-medium">{order.customer?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الهاتف</span>
                <span className="font-medium" dir="ltr">{order.customer?.phone || "—"}</span>
              </div>
              {order.customer?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">البريد</span>
                  <span className="font-medium">{order.customer.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pickup info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                معلومات الاستلام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفرع</span>
                <span className="font-medium">{order.pickup?.branchName || order.pickup?.branchId || "—"}</span>
              </div>
              {order.pickup?.window && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">النافذة الزمنية</span>
                  <span className="font-medium">{order.pickup.window}</span>
                </div>
              )}
              {order.pickup?.pickupCode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رمز الاستلام</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-bold text-primary" dir="ltr">
                    {order.pickup.pickupCode}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                الدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحالة</span>
                <Badge
                  variant="outline"
                  className={
                    order.payment?.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                  }
                >
                  {order.payment?.status === "paid" ? "مدفوع" : order.payment?.status === "initiated" ? "قيد الدفع" : order.payment?.status || "—"}
                </Badge>
              </div>
              {order.payment?.method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الطريقة</span>
                  <span className="font-medium">{order.payment.method}</span>
                </div>
              )}
              {order.payment?.reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المرجع</span>
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">{order.payment.reference}</span>
                </div>
              )}
              {/* Pricing – backend-calculated, do NOT recalculate or add VAT */}
              {order.pricing && (
                <>
                  <Separator className="my-2" />
                  {order.pricing.subtotal != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span className="font-medium">{order.pricing.subtotal}</span>
                    </div>
                  )}
                  {order.pricing.discount != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الخصم</span>
                      <span className="font-medium text-red-500">-{order.pricing.discount}</span>
                    </div>
                  )}
                  {order.pricing.vat != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الضريبة (مشمولة)</span>
                      <span className="font-medium">{order.pricing.vat}</span>
                    </div>
                  )}
                  {order.pricing.total != null && (
                    <div className="flex justify-between font-bold">
                      <span>الإجمالي</span>
                      <span>{order.pricing.total} {order.pricing.currency || ""}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center + Right: Items + Activity + Actions */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ChefHat className="h-4 w-4 text-primary" />
                عناصر الطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items?.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.name}</span>
                        {item.notes && (
                          <span className="text-xs text-muted-foreground">ملاحظة: {item.notes}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                        {item.unitPrice != null && (
                          <span className="font-medium">{item.unitPrice}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد عناصر</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                سجل النشاط
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.activity?.length > 0 ? (
                <div className="relative space-y-4 pr-4 before:absolute before:right-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-border">
                  {order.activity.map((entry, idx) => (
                    <div key={idx} className="relative flex gap-3">
                      <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{entry.action}</span>
                        {entry.fromStatus && entry.toStatus && (
                          <span className="text-xs text-muted-foreground">
                            {entry.fromStatus} → {entry.toStatus}
                          </span>
                        )}
                        {entry.reason && (
                          <span className="text-xs text-muted-foreground">السبب: {entry.reason}</span>
                        )}
                        {entry.performedBy && (
                          <span className="text-xs text-muted-foreground">بواسطة: {entry.performedBy}</span>
                        )}
                        <span className="text-[11px] text-muted-foreground/70" dir="ltr">
                          {new Date(entry.timestamp).toLocaleString("ar-EG")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا يوجد نشاط بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {!isFinal && order.allowedActions?.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">الإجراءات المتاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {order.allowedActions
                    .filter((a) => !isUnsupportedOneTimeOrderAction(a))
                    .map((action) => {
                      const config = getActionConfig(action);
                      if (action === "prepare" && isNonOperational) return null;
                      return (
                        <Button
                          key={action}
                          variant={config.variant}
                          className="shadow-sm transition-all active:scale-95"
                          onClick={() => handleAction(action)}
                          disabled={actionMutation.isPending}
                        >
                          {config.icon}
                          {config.label}
                        </Button>
                      );
                    })}
                </div>
                {isNonOperational && (
                  <p className="mt-3 text-sm text-amber-600">
                    لا يمكن تنفيذ إجراءات تشغيلية لطلب غير مدفوع.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog(null);
            setCancelReason("");
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              {confirmDialog?.action === "fulfill" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {confirmDialog?.action === "fulfill"
                ? "تأكيد استلام العميل للطلب"
                : "تأكيد إلغاء الطلب"}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base">
              {confirmDialog?.action === "fulfill"
                ? "يرجى التأكد من أن العميل قد استلم الطلب فعلاً من الفرع."
                : "هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء بسهولة."}
            </AlertDialogDescription>

            {confirmDialog?.action === "cancel" && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-foreground/80">سبب الإلغاء</label>
                <Input
                  placeholder="أدخل سبب الإلغاء..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="focus-visible:ring-primary"
                  dir="rtl"
                  autoFocus
                />
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={
                actionMutation.isPending ||
                (confirmDialog?.action === "cancel" && !cancelReason.trim())
              }
              className={
                confirmDialog?.action === "cancel"
                  ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  : confirmDialog?.action === "fulfill"
                  ? "bg-emerald-600 font-bold px-8 hover:bg-emerald-700"
                  : ""
              }
            >
              {confirmDialog?.action === "fulfill" ? "تأكيد الاستلام" : "تأكيد الإلغاء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
