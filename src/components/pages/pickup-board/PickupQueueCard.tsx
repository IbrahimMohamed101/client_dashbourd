import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  EyeOff,
  RotateCcw,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import {
  getOneTimeOrderStatusColor,
  isUnsupportedOneTimeOrderAction,
  type OneTimeOrderStatus,

} from "@/types/oneTimeOrderTypes";
import { isOneTimeOrder } from "@/hooks/usePickupBoard";

interface PickupQueueCardProps {
  order: UnifiedQueueItem;
  handleFulfill: (item: UnifiedQueueItem) => void;
  requestAction: (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous?: boolean
  ) => void;
  isPending: boolean;
}

export const PickupQueueCard: React.FC<PickupQueueCardProps> = ({
  order,
  handleFulfill,
  requestAction,
  isPending,
}) => {
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
    (!isOTO || !isUnsupportedOneTimeOrderAction("fulfill"));
  const canReadyForPickup =
    order.allowedActions?.includes("ready_for_pickup") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("ready_for_pickup"));
  const canCancel =
    order.allowedActions?.includes("cancel") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("cancel"));
  const canNoShow =
    order.allowedActions?.includes("no_show") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("no_show"));
  const canReopen =
    order.allowedActions?.includes("reopen") &&
    (!isOTO || !isUnsupportedOneTimeOrderAction("reopen"));

  const displayName = isOTO
    ? order.customer?.name || order.orderNumber || order.entityId
    : order.userName || order.id;
  const displayPhone = isOTO
    ? order.customer?.phone || ""
    : order.userPhone || "";

  return (
    <Card
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
              {isOTO && <ShoppingBag className="h-4 w-4 text-purple-500" />}
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
                <span className="font-medium">{order.pickup.branchName}</span>
              </div>
            )}
            {order.pickup.window && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">النافذة</span>
                <span className="font-medium">{order.pickup.window}</span>
              </div>
            )}
            {order.pickup.pickupCode && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">رمز الاستلام</span>
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

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canFulfill && (
            <Button
              className="h-9 flex-1 bg-emerald-600 text-xs font-semibold hover:bg-emerald-700"
              onClick={() => handleFulfill(order)}
              disabled={isPending}
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
              disabled={isPending}
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
              onClick={() => requestAction(order, "no_show", "لم يحضر", false)}
              disabled={isPending}
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
              onClick={() => requestAction(order, "cancel", "إلغاء", true)}
              disabled={isPending}
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
              onClick={() => requestAction(order, "reopen", "إعادة فتح", false)}
              disabled={isPending}
            >
              <RotateCcw className="ml-1 h-3.5 w-3.5" />
              إعادة فتح
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
