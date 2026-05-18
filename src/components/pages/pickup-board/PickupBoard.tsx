import React, { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لوحة الاستلام</h1>
        <Input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="w-48"
        />
      </div>

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

export default PickupBoard;
