import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, PackageCheck, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/global/loader";
import { usePickupQueueQuery } from "@/hooks/useOneTimeOrdersQuery";

import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

import { usePickupAction } from "@/hooks/usePickupBoard";
import { PickupQueueCard } from "./PickupQueueCard";
import { FulfillDialog } from "./FulfillDialog";
import { type ReasonDialogState, ReasonActionDialog } from "./ReasonActionDialog";

export const PickupBoard: React.FC = () => {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [fulfillDialog, setFulfillDialog] = useState<UnifiedQueueItem | null>(null);
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>({
    open: false,
    item: null,
    action: "",
    actionLabel: "",
    isDangerous: false,
  });

  const { data: queueData, isLoading } = usePickupQueueQuery({ date });
  const { executeAction, isPending } = usePickupAction();

  const handleFulfill = (item: UnifiedQueueItem) => {
    setFulfillDialog(item);
  };

  const onConfirmFulfill = (values: { pickupCode?: string }) => {
    if (!fulfillDialog) return;
    executeAction({
      item: fulfillDialog,
      action: "fulfill",
      reason: "Customer picked up the order from branch",
      pickupCode: values.pickupCode || undefined,
    });
    setFulfillDialog(null);
  };

  const requestAction = (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous: boolean = false
  ) => {
    setReasonDialog({ open: true, item, action, actionLabel, isDangerous });
  };

  const onConfirmReason = (values: { reason: string; notes?: string }) => {
    if (!reasonDialog.item) return;
    executeAction({
      item: reasonDialog.item,
      action: reasonDialog.action,
      reason: values.reason.trim(),
      notes: values.notes?.trim() || undefined,
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

  const orders: UnifiedQueueItem[] = (queueData?.data?.items ?? []).map(
    (item: any) => ({
      ...item,
      id: item.entityId || item.id || "",
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
          {orders.map((order) => (
            <PickupQueueCard
              key={order.entityId || order.subscriptionDayId || order.id}
              order={order}
              handleFulfill={handleFulfill}
              requestAction={requestAction}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Fulfill Dialog */}
      <FulfillDialog
        item={fulfillDialog}
        onOpenChange={(open) => {
          if (!open) setFulfillDialog(null);
        }}
        onSubmit={onConfirmFulfill}
        isPending={isPending}
      />

      {/* Reason Dialog */}
      <ReasonActionDialog
        dialogState={reasonDialog}
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
        onSubmit={onConfirmReason}
        isPending={isPending}
      />
    </div>
  );
};
