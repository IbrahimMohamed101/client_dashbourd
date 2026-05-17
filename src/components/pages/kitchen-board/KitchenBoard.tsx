import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, ListTodo, ChefHat, CheckCircle2 } from "lucide-react";
import { Loader } from "@/components/global/loader";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

import { useKitchenQueueQuery, useKitchenActionMutation, isOneTimeOrder } from "@/hooks/useKitchenBoard";
import { KitchenQueueCard } from "./KitchenQueueCard";
import { type ReasonDialogState, ReasonActionDialog } from "./ReasonActionDialog";

export const KitchenBoard: React.FC = () => {
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>({
    open: false,
    item: null,
    action: "",
    actionLabel: "",
    isDangerous: false,
  });

  const { data: queueData, isLoading } = useKitchenQueueQuery();
  const updateStatus = useKitchenActionMutation();

  const requestAction = (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous: boolean = false
  ) => {
    setReasonDialog({
      open: true,
      item,
      action,
      actionLabel,
      isDangerous,
    });
  };

  const onConfirmSubmit = (values: { reason: string; notes?: string }) => {
    if (!reasonDialog.item) return;
    updateStatus.mutate({
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

  if (isLoading) return <Loader label="جاري تحميل طلبات المطبخ..." />;

  const orders = queueData?.data?.items || [];

  const sections = [
    {
      statuses: ["open", "locked", "confirmed"],
      label: "بانتظار التحضير",
      icon: <ListTodo className="h-5 w-5" />,
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      primaryAction: "prepare",
      primaryActionLabel: "بدء التحضير",
    },
    {
      statuses: ["in_preparation"],
      label: "جاري التحضير",
      icon: <ChefHat className="h-5 w-5" />,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      primaryAction: "ready_for_pickup",
      primaryActionLabel: "إكمال التحضير",
    },
    {
      statuses: ["ready_for_pickup"],
      label: "جاهز للتسليم",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "bg-green-500/10 text-green-600 border-green-200",
      primaryAction: "dispatch",
      primaryActionLabel: "إرسال للمندوب",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">لوحة المطبخ</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex gap-2 px-3 py-1">
            <Clock className="h-4 w-4" />
            {new Date().toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-3">
        {sections.map((section) => {
          const sectionOrders = orders.filter((o) =>
            section.statuses.includes(o.status)
          );
          return (
            <div
              key={section.label}
              className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-muted/30 p-4 shadow-sm"
            >
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 ${section.color}`}
              >
                {section.icon}
                <h2 className="text-lg font-bold">{section.label}</h2>
                <Badge variant="secondary" className="mr-auto font-mono">
                  {sectionOrders.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {sectionOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    لا توجد طلبات
                  </p>
                ) : (
                  sectionOrders.map((order) => {
                    const isOTO = isOneTimeOrder(order);
                    const itemKey = isOTO
                      ? order.entityId || order.id
                      : order.subscriptionDayId || order.id;

                    return (
                      <KitchenQueueCard
                        key={itemKey}
                        order={order}
                        section={section}
                        requestAction={requestAction}
                        isPending={updateStatus.isPending}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

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
        onSubmit={onConfirmSubmit}
        isPending={updateStatus.isPending}
      />
    </div>
  );
};

export default KitchenBoard;
