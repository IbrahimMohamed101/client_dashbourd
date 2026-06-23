import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { DeliveryDashboardCards } from "@/components/pages/delivery/DeliveryDashboardCards";
import { DeliveryFilters } from "@/components/pages/delivery/DeliveryFilters";
import { DeliveryList } from "@/components/pages/delivery/DeliveryList";
import {
  ReasonActionDialog,
  type ReasonDialogState,
} from "@/components/pages/pickup-board/ReasonActionDialog";
import {
  useCourierDeliveryActionMutation,
  useCourierDeliveryListQuery,
} from "@/hooks/useCourierDeliveriesQuery";
import {
  buildOperationsActionPayload,
  getCourierItems,
  safeText,
} from "@/lib/operationsBoard";
import type {
  DashboardOpsActionRequest,
  DashboardOpsStatusFilter,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";
import { matchesStatusFilter } from "@/types/dashboardOpsTypes";

export const Route = createFileRoute("/_protected/delivery/")({
  component: DeliveryDashboard,
});

const EMPTY_REASON_DIALOG: ReasonDialogState = {
  open: false,
  item: null,
  action: "",
  actionLabel: "",
  isDangerous: false,
};

type DeliverySourceFilter = "all" | "subscription" | "one_time_order";
type DeliveryActionFilter = "all" | "needs_action" | "ready_to_collect" | "out_for_delivery" | "no_actions";

function getDeliveryWindow(item: UnifiedQueueItem) {
  return item.context.window || item.delivery?.window || item.delivery?.deliveryWindow || "";
}

function getDeliveryZone(item: UnifiedQueueItem) {
  return item.delivery?.zone?.name || item.delivery?.zone?.id || item.delivery?.zoneId || "";
}

function hasAction(item: UnifiedQueueItem, actionId: string) {
  return item.allowedActions?.some((action) => action.id === actionId);
}

function matchesActionFilter(item: UnifiedQueueItem, filter: DeliveryActionFilter) {
  if (filter === "all") return true;
  if (filter === "needs_action") return Boolean(item.allowedActions?.length);
  if (filter === "ready_to_collect") return hasAction(item, "dispatch") || hasAction(item, "pickup");
  if (filter === "out_for_delivery") return item.status === "out_for_delivery";
  if (filter === "no_actions") return !item.allowedActions?.length;
  return true;
}

function DeliveryDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [statusFilter, setStatusFilter] = useState<DashboardOpsStatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<DeliverySourceFilter>("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<DeliveryActionFilter>("all");
  const [searchStr, setSearchStr] = useState("");
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState>(EMPTY_REASON_DIALOG);

  const { data: listRes, isLoading: isListLoading } = useCourierDeliveryListQuery(today);
  const actionMutation = useCourierDeliveryActionMutation();

  const baseData = getCourierItems(listRes?.data?.items ?? []);

  const displayData = baseData.filter((item) => {
    const search = searchStr.trim().toLowerCase();
    const matchesStatus = statusFilter === "all" || matchesStatusFilter(item.status, statusFilter);
    const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
    const matchesWindow = windowFilter === "all" || getDeliveryWindow(item) === windowFilter;
    const matchesZone = zoneFilter === "all" || getDeliveryZone(item) === zoneFilter;
    const matchesAction = matchesActionFilter(item, actionFilter);
    const matchesSearch = !search || [
      item.customer.name,
      item.customer.phone,
      item.reference,
      item.orderNumber,
      item.context.addressSummary,
      item.delivery?.addressSummary,
      getDeliveryWindow(item),
      getDeliveryZone(item),
      item.status,
    ]
      .map((value) => safeText(value, "").toLowerCase())
      .some((value) => value.includes(search));

    return matchesStatus && matchesSource && matchesWindow && matchesZone && matchesAction && matchesSearch;
  });

  const resetFilters = () => {
    setStatusFilter("all");
    setSourceFilter("all");
    setWindowFilter("all");
    setZoneFilter("all");
    setActionFilter("all");
    setSearchStr("");
  };

  const runAction = (action: string, payload: DashboardOpsActionRequest) => {
    actionMutation.mutate({ action, payload });
  };

  const handleActionClick = (
    item: UnifiedQueueItem,
    action: string,
    payload: DashboardOpsActionRequest
  ) => {
    const actionDef = item.allowedActions?.find((entry) => entry.id === action);

    if (actionDef?.requiresReason || action === "cancel") {
      setReasonDialog({
        open: true,
        item,
        action,
        actionLabel: actionDef?.label || "تعذر التوصيل",
        isDangerous: true,
      });
      return;
    }

    runAction(action, payload);
  };

  const handleReasonSubmit = (values: { reason: string; notes?: string }) => {
    if (!reasonDialog.item || !reasonDialog.action) return;

    runAction(
      reasonDialog.action,
      buildOperationsActionPayload(
        reasonDialog.item,
        reasonDialog.action,
        values.reason,
        values.notes
      )
    );
    setReasonDialog(EMPTY_REASON_DIALOG);
  };

  return (
    <div className="flex h-auto min-h-full flex-col gap-3 px-3 pb-6 sm:px-4 md:h-[calc(100vh-var(--header-height)-3rem)] md:gap-4 md:overflow-hidden md:px-6 md:pt-4 md:pb-0">
      <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between md:pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">التوصيل</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            شاشة سريعة لمتابعة العنوان، الوقت، العميل، والإجراء المتاح فقط.
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-2 text-right shadow-sm">
          <span className="block text-[11px] font-bold text-muted-foreground">بيانات اليوم</span>
          <span className="font-mono text-sm font-bold">{today}</span>
        </div>
      </div>

      <DeliveryDashboardCards data={baseData} isLoading={isListLoading} />

      <DeliveryFilters
        searchStr={searchStr}
        onSearchChange={setSearchStr}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        windowFilter={windowFilter}
        onWindowFilterChange={setWindowFilter}
        zoneFilter={zoneFilter}
        onZoneFilterChange={setZoneFilter}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        onReset={resetFilters}
        baseData={baseData}
      />

      <div className="flex items-start gap-2 rounded-lg bg-blue-50/70 p-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 md:text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>تظهر الطلبات حسب صلاحيات الباكند. استخدم الفلاتر للوصول للعنوان أو الطلب بسرعة.</span>
      </div>

      <div className="custom-scrollbar min-h-[520px] flex-1 overflow-y-auto rounded-2xl border bg-muted/5 p-3 md:min-h-0 md:p-4">
        <DeliveryList
          data={displayData}
          isLoading={isListLoading}
          onActionClick={handleActionClick}
          isActionLoading={actionMutation.isPending}
        />
      </div>

      <ReasonActionDialog
        dialogState={reasonDialog}
        onOpenChange={(open) => setReasonDialog((current) => (open ? current : EMPTY_REASON_DIALOG))}
        onSubmit={handleReasonSubmit}
        isPending={actionMutation.isPending}
      />
    </div>
  );
}
