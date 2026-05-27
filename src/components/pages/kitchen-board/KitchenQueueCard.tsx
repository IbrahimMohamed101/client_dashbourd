import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Truck, Bell, XCircle, RotateCcw } from "lucide-react";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isUnsupportedOneTimeOrderAction } from "@/types/oneTimeOrderTypes";
import { isOneTimeOrder } from "@/types/dashboardOpsTypes";

interface SectionDef {
  statuses: string[];
  label: string;
  icon: React.ReactNode;
  color: string;
  primaryAction?: string;
  primaryActionLabel?: string;
}

interface KitchenQueueCardProps {
  order: UnifiedQueueItem;
  section: SectionDef;
  requestAction: (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous?: boolean
  ) => void;
  isPending: boolean;
}

export const KitchenQueueCard: React.FC<KitchenQueueCardProps> = ({
  order,
  section,
  requestAction,
  isPending,
}) => {
  const isOTO = isOneTimeOrder(order);

  // Do not prepare unpaid one-time orders
  const isNonOperational =
    isOTO &&
    (order.paymentStatus !== "paid" || order.status === "pending_payment");

  const actionIds = order.allowedActions?.map((a) => a.id) || [];
  const canPrimary =
    section.primaryAction &&
    actionIds.includes(section.primaryAction) &&
    !isNonOperational;
  const canCancel =
    actionIds.includes("cancel") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("cancel"));
  const canReopen =
    actionIds.includes("reopen") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("reopen"));
  const canDispatch =
    actionIds.includes("dispatch") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("dispatch"));
  const canNotifyArrival =
    actionIds.includes("notify_arrival") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("notify_arrival"));

  return (
    <Card
      className={`group border-border transition-all duration-200 hover:shadow-md ${
        isOTO ? "border-purple-500/20" : ""
      }`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-1.5 text-base font-bold">
              {order.customer?.name || "Unknown"}
              {isOTO && <ShoppingBag className="h-3.5 w-3.5 text-purple-500" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{order.customer?.phone || ""}</p>
            {isOTO && order.orderNumber && (
              <p className="font-mono text-xs text-purple-500">
                {order.orderNumber}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${
              isOTO
                ? "border-purple-500/20 bg-purple-500/10 text-purple-600"
                : "bg-primary/5 text-primary"
            }`}
          >
            {isOTO ? (
              <>
                <Store className="ml-1 h-3 w-3" />
                استلام
              </>
            ) : order.mode === "delivery" ? (
              "توصيل"
            ) : (
              "استلام"
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {/* Items: one-time orders use items[], subscriptions use mealSlots */}
        {isOTO && order.items && order.items.length > 0 && (
          <div className="space-y-1 rounded-md bg-muted/50 p-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">x{item.quantity}</span>
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
                  <span className="text-muted-foreground">x{item.quantity}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pickup info for one-time orders */}
        {isOTO && (order.context?.branch || order.context?.window) && (
          <div className="space-y-0.5 rounded-md bg-purple-500/5 p-2 text-xs">
            {order.context?.branch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفرع</span>
                <span className="font-medium">{order.context.branch}</span>
              </div>
            )}
            {order.context?.window && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">النافذة</span>
                <span className="font-medium">{order.context.window}</span>
              </div>
            )}
          </div>
        )}

        {/* Non-operational warning */}
        {isNonOperational && (
          <p className="text-xs font-medium text-amber-600">
            طلب غير مدفوع – لا يمكن التحضير
          </p>
        )}

        {/* Primary action button */}
        {canPrimary && section.primaryActionLabel && (
          <Button
            className="h-8 w-full text-xs"
            onClick={() =>
              requestAction(
                order,
                section.primaryAction!,
                section.primaryActionLabel!,
                false
              )
            }
            disabled={isPending}
          >
            {section.primaryActionLabel}
          </Button>
        )}

        {/* Cancel, Reopen, Dispatch, Notify Arrival actions */}
        <div className="flex flex-wrap gap-2">
          {canDispatch && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 border-blue-300 text-xs text-blue-600 hover:bg-blue-50"
              onClick={() =>
                requestAction(order, "dispatch", "إرسال للموصّل", false)
              }
              disabled={isPending}
            >
              <Truck className="ml-1 h-3 w-3" />
              إرسال للموصّل
            </Button>
          )}
          {canNotifyArrival && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 border-teal-300 text-xs text-teal-600 hover:bg-teal-50"
              onClick={() =>
                requestAction(order, "notify_arrival", "وصول قريب", false)
              }
              disabled={isPending}
            >
              <Bell className="ml-1 h-3 w-3" />
              وصول قريب
            </Button>
          )}
          {canCancel && !isNonOperational && (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => requestAction(order, "cancel", "إلغاء", true)}
              disabled={isPending}
            >
              <XCircle className="ml-1 h-3 w-3" />
              إلغاء
            </Button>
          )}
          {canReopen && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => requestAction(order, "reopen", "إعادة فتح", false)}
              disabled={isPending}
            >
              <RotateCcw className="ml-1 h-3 w-3" />
              إعادة فتح
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
