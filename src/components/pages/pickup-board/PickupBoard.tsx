import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  Clock,
  PackageCheck,
  ShoppingBag,
  Store,
  XCircle,
  RotateCcw,
  ChefHat,
  EyeOff,
} from "lucide-react";
import { Loader } from "@/components/global/loader";
import {
  usePickupQueueQuery,
  useOneTimeOrderActionMutation,
} from "@/hooks/useOneTimeOrdersQuery";
import type {
  OneTimeOrderActionRequest,
  OneTimeOrderAction,
  OneTimeOrderStatus,
  PickupQueueOneTimeOrder,
} from "@/types/oneTimeOrderTypes";
import {
  getOneTimeOrderStatusColor,
  isUnsupportedOneTimeOrderAction,
} from "@/types/oneTimeOrderTypes";
import api from "@/lib/apis";

// ── Unified pickup queue item for both subscription days and one-time orders ──
interface PickupQueueItem {
  id: string;
  status: string;
  method: "delivery" | "pickup";
  allowedActions: string[];
  notes?: string;

  // Discriminator fields
  source?: "subscription" | "one_time_order";
  entityType?: "subscription_day" | "order";
  entityId?: string;
  subscriptionDayId?: string;

  // One-time order fields
  orderNumber?: string;
  items?: { id: string; name: string; quantity: number; notes?: string }[];
  paymentStatus?: string;
  fulfillmentMethod?: "pickup" | "delivery";
  pickup?: {
    branchId: string;
    branchName?: string;
    window?: string;
    pickupCode?: string;
  };
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
  };

  // Subscription day fields
  userName?: string;
  userPhone?: string;
  mealSlots?: {
    slot: string;
    items: { name: string; quantity: number; notes?: string }[];
  }[];
}

// ── Reason dialog state ──
interface ReasonDialogState {
  open: boolean;
  item: PickupQueueItem | null;
  action: string;
  actionLabel: string;
  isDangerous: boolean;
}

export const PickupBoard: React.FC = () => {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [fulfillDialog, setFulfillDialog] = useState<PickupQueueItem | null>(
    null
  );
  const [pickupCode, setPickupCode] = useState("");
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>({
    open: false,
    item: null,
    action: "",
    actionLabel: "",
    isDangerous: false,
  });
  const [reason, setReason] = useState("");
  const [reasonNotes, setReasonNotes] = useState("");

  const { data: queueData, isLoading } = usePickupQueueQuery({ date });
  const otoActionMutation = useOneTimeOrderActionMutation();

  // ── Helper: check if this is a one-time order ──
  const isOneTimeOrder = (item: PickupQueueItem): boolean => {
    return item.source === "one_time_order" || item.entityType === "order";
  };

  // ── Unified action handler ──
  const executeAction = async ({
    item,
    action,
    reason: actionReason,
    notes: actionNotes,
    pickupCode: actionPickupCode,
  }: {
    item: PickupQueueItem;
    action: string;
    reason?: string;
    notes?: string;
    pickupCode?: string;
  }) => {
    if (isOneTimeOrder(item)) {
      // One-Time Order: use order-specific action endpoint
      const orderId = item.entityId || item.id;
      const body: OneTimeOrderActionRequest = {};
      if (actionReason) body.reason = actionReason;
      if (actionNotes) body.notes = actionNotes;
      if (actionPickupCode) body.pickupCode = actionPickupCode;

      otoActionMutation.mutate({
        orderId,
        action: action as OneTimeOrderAction,
        body,
      });
    } else {
      // Subscription Day: use unified pickup action endpoint
      // POST /api/dashboard/pickup/actions/:action
      await api.post(`/api/dashboard/pickup/actions/${action}`, {
        entityId: item.subscriptionDayId || item.id,
        entityType: "subscription_day",
        payload: {
          reason: actionReason || `Pickup action: ${action}`,
          notes: actionNotes || item.notes,
          ...(actionPickupCode ? { pickupCode: actionPickupCode } : {}),
        },
      });
    }
  };

  const handleFulfill = (item: PickupQueueItem) => {
    setFulfillDialog(item);
  };

  const handleConfirmFulfill = () => {
    if (!fulfillDialog) return;
    executeAction({
      item: fulfillDialog,
      action: "fulfill",
      reason: "Customer picked up the order from branch",
      pickupCode: pickupCode || undefined,
    });
    setFulfillDialog(null);
    setPickupCode("");
  };

  const requestAction = (
    item: PickupQueueItem,
    action: string,
    actionLabel: string,
    isDangerous: boolean = false
  ) => {
    setReason("");
    setReasonNotes("");
    setReasonDialog({ open: true, item, action, actionLabel, isDangerous });
  };

  const confirmReasonAction = () => {
    if (!reasonDialog.item) return;
    executeAction({
      item: reasonDialog.item,
      action: reasonDialog.action,
      reason: reason || undefined,
      notes: reasonNotes || undefined,
    });
    setReasonDialog({
      open: false,
      item: null,
      action: "",
      actionLabel: "",
      isDangerous: false,
    });
  };

  if (isLoading) return <Loader label="جاري تحميل طلبات الاستلام..." />;

  const orders: PickupQueueItem[] = (queueData?.data?.items ?? []).map(
    (item: PickupQueueOneTimeOrder) => ({
      ...item,
      id: item.entityId || "",
      method: item.fulfillmentMethod || "pickup",
    })
  );

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Store className="h-8 w-8 text-teal-500" />
            لوحة الاستلام من الفرع
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            طلبات جاهزة للاستلام – تشمل الاشتراكات والطلبات لمرة واحدة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarIcon className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44 pr-10 text-right"
            />
          </div>
          <Badge variant="outline" className="flex gap-2 px-3 py-1">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        </div>
      </div>

      {/* Orders grid */}
      {orders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <PackageCheck className="h-8 w-8 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            لا توجد طلبات جاهزة للاستلام
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            لا توجد طلبات بحالة جاهز للاستلام في هذا اليوم.
          </p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {orders.map((order) => {
            const isOTO = isOneTimeOrder(order);
            const statusColor = isOTO
              ? getOneTimeOrderStatusColor(order.status as OneTimeOrderStatus)
              : {
                  bg: "bg-primary/5",
                  text: "text-primary",
                  border: "border-primary/20",
                };
            const canFulfill =
              order.allowedActions?.includes("fulfill") &&
              !isUnsupportedOneTimeOrderAction("fulfill");
            const canReadyForPickup =
              order.allowedActions?.includes("ready_for_pickup") &&
              !isUnsupportedOneTimeOrderAction("ready_for_pickup");
            const canCancel =
              order.allowedActions?.includes("cancel") &&
              !isUnsupportedOneTimeOrderAction("cancel");
            const canNoShow =
              order.allowedActions?.includes("no_show") &&
              !isUnsupportedOneTimeOrderAction("no_show");
            const canReopen =
              order.allowedActions?.includes("reopen") &&
              !isUnsupportedOneTimeOrderAction("reopen");

            const displayName = isOTO
              ? order.customer?.name || order.orderNumber || order.entityId
              : order.userName || order.id;
            const displayPhone = isOTO
              ? order.customer?.phone || ""
              : order.userPhone || "";

            return (
              <Card
                key={order.entityId || order.subscriptionDayId || order.id}
                className={`group transition-all duration-200 hover:shadow-md ${
                  isOTO
                    ? "border-purple-500/20 bg-purple-500/5"
                    : "border-teal-500/20 bg-teal-500/5"
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base font-bold">
                        {isOTO && (
                          <ShoppingBag className="h-4 w-4 text-purple-500" />
                        )}
                        {displayName}
                      </CardTitle>
                      {displayPhone && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {displayPhone}
                        </p>
                      )}
                      {isOTO && order.orderNumber && (
                        <p className="font-mono text-xs text-purple-500">
                          {order.orderNumber}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} text-xs`}
                    >
                      <Store className="ml-1 h-3 w-3" />
                      استلام
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  {/* Pickup info */}
                  {order.pickup && (
                    <div className="space-y-1 rounded-md bg-muted/50 p-2">
                      {order.pickup.branchName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">الفرع</span>
                          <span className="font-medium">
                            {order.pickup.branchName}
                          </span>
                        </div>
                      )}
                      {order.pickup.window && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">النافذة</span>
                          <span className="font-medium">
                            {order.pickup.window}
                          </span>
                        </div>
                      )}
                      {order.pickup.pickupCode && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            رمز الاستلام
                          </span>
                          <span
                            className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-bold text-primary"
                            dir="ltr"
                          >
                            {order.pickup.pickupCode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items: one-time orders use items[], subscriptions use mealSlots */}
                  {isOTO && order.items && order.items.length > 0 && (
                    <div className="space-y-1 rounded-md bg-muted/50 p-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isOTO && order.mealSlots && order.mealSlots.length > 0 && (
                    <div className="space-y-1 rounded-md bg-muted/50 p-2">
                      {order.mealSlots.map((slot) =>
                        slot.items.map((item) => (
                          <div
                            key={`${slot.slot}-${item.name}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground">
                              x{item.quantity}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {canFulfill && (
                      <Button
                        className="h-9 flex-1 bg-emerald-600 text-xs font-semibold hover:bg-emerald-700"
                        onClick={() => handleFulfill(order)}
                        disabled={otoActionMutation.isPending}
                      >
                        <CheckCircle2 className="ml-1.5 h-4 w-4" />
                        تم الاستلام
                      </Button>
                    )}
                    {canReadyForPickup && (
                      <Button
                        className="h-9 flex-1 bg-teal-600 text-xs font-semibold hover:bg-teal-700"
                        onClick={() =>
                          requestAction(
                            order,
                            "ready_for_pickup",
                            "جاهز للاستلام",
                            false
                          )
                        }
                        disabled={otoActionMutation.isPending}
                      >
                        <Store className="ml-1.5 h-4 w-4" />
                        جاهز للاستلام
                      </Button>
                    )}
                    {canNoShow && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 border-orange-300 text-xs text-orange-600 hover:bg-orange-50"
                        onClick={() =>
                          requestAction(order, "no_show", "لم يحضر", false)
                        }
                        disabled={otoActionMutation.isPending}
                      >
                        <EyeOff className="ml-1 h-3.5 w-3.5" />
                        لم يحضر
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() =>
                          requestAction(order, "cancel", "إلغاء", true)
                        }
                        disabled={otoActionMutation.isPending}
                      >
                        <XCircle className="ml-1 h-3.5 w-3.5" />
                        إلغاء
                      </Button>
                    )}
                    {canReopen && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() =>
                          requestAction(order, "reopen", "إعادة فتح", false)
                        }
                        disabled={otoActionMutation.isPending}
                      >
                        <RotateCcw className="ml-1 h-3.5 w-3.5" />
                        إعادة فتح
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fulfill confirmation dialog with pickup code */}
      <AlertDialog
        open={!!fulfillDialog}
        onOpenChange={(open) => {
          if (!open) {
            setFulfillDialog(null);
            setPickupCode("");
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              تأكيد استلام العميل للطلب
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base">
              يرجى التأكد من أن العميل قد استلم الطلب فعلاً من الفرع.
              {fulfillDialog?.pickup?.pickupCode && (
                <span className="mt-2 block text-sm">
                  رمز الاستلام المتوقع:{" "}
                  <strong dir="ltr">{fulfillDialog.pickup.pickupCode}</strong>
                </span>
              )}
            </AlertDialogDescription>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-foreground/80">
                رمز الاستلام
              </label>
              <Input
                placeholder="000000"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value)}
                className="h-12 border-2 text-center text-2xl font-bold tracking-[0.5em] focus-visible:ring-primary"
                dir="ltr"
                autoFocus
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFulfill}
              disabled={otoActionMutation.isPending}
              className="bg-emerald-600 px-8 font-bold hover:bg-emerald-700"
            >
              تأكيد الاستلام
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reason confirmation dialog for cancel/reopen/ready_for_pickup */}
      <AlertDialog
        open={reasonDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setReasonDialog({
              open: false,
              item: null,
              action: "",
              actionLabel: "",
              isDangerous: false,
            });
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              {reasonDialog.isDangerous ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <ChefHat className="h-5 w-5 text-primary" />
              )}
              تأكيد: {reasonDialog.actionLabel}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base">
              يرجى إدخال سبب هذا الإجراء للحفاظ على سجل التدقيق.
            </AlertDialogDescription>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground/80">
                  السبب <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="أدخل سبب الإجراء..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground/80">
                  ملاحظات
                </label>
                <Input
                  placeholder="ملاحظات إضافية (اختياري)"
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-4">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReasonAction}
              disabled={otoActionMutation.isPending || !reason.trim()}
              className={
                reasonDialog.isDangerous
                  ? "bg-red-600 px-8 font-bold hover:bg-red-700"
                  : "bg-primary px-8 font-bold"
              }
            >
              تأكيد {reasonDialog.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
