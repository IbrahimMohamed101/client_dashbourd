import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeliveryDashboardCards } from "@/components/pages/delivery/DeliveryDashboardCards";
import { DeliveryFilters } from "@/components/pages/delivery/DeliveryFilters";
import { DeliveryList } from "@/components/pages/delivery/DeliveryList";
import {
  useCourierDeliveryActionMutation,
  useCourierDeliveryListQuery,
} from "@/hooks/useCourierDeliveriesQuery";
import type {
  DashboardOpsActionRequest,
  DashboardOpsStatusFilter,
} from "@/types/dashboardOpsTypes";
import { matchesStatusFilter } from "@/types/dashboardOpsTypes";
import { getCourierItems, safeText } from "@/lib/operationsBoard";

export const Route = createFileRoute("/_protected/delivery/")({
  component: DeliveryDashboard,
});

function DeliveryDashboard() {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] =
    useState<DashboardOpsStatusFilter>("all");
  const [searchStr, setSearchStr] = useState("");

  const { data: listRes, isLoading: isListLoading } =
    useCourierDeliveryListQuery(date);
  const actionMutation = useCourierDeliveryActionMutation();

  const baseData = getCourierItems(listRes?.data?.items ?? []);

  const displayData = (() => {
    const filteredByStatus =
      statusFilter === "all"
        ? baseData
        : baseData.filter((item) =>
            matchesStatusFilter(item.status, statusFilter)
          );
    const search = searchStr.trim().toLowerCase();

    if (!search) return filteredByStatus;

    return filteredByStatus.filter((item) =>
      [
        item.customer.name,
        item.customer.phone,
        item.reference,
        item.orderNumber,
        item.context.addressSummary,
        item.delivery?.deliveryWindow,
        item.status,
      ]
        .map((value) => safeText(value, "").toLowerCase())
        .some((value) => value.includes(search))
    );
  })();

  const handleActionClick = (
    action: string,
    payload: DashboardOpsActionRequest
  ) => {
    actionMutation.mutate({ action, payload });
  };

  return (
    <div className="flex h-auto min-h-full flex-col gap-3 px-4 pb-6 md:h-[calc(100vh-var(--header-height)-3rem)] md:gap-4 md:overflow-hidden md:px-6 md:pt-4 md:pb-0">
      <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between md:pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            التوصيل
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            إدارة ومتابعة عمليات التوصيل اليومية من نقاط courier contract.
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <CalendarIcon className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 w-full bg-card pr-10 text-right shadow-sm md:h-9 md:w-44"
          />
        </div>
      </div>

      <DeliveryDashboardCards data={baseData} isLoading={isListLoading} />

      <DeliveryFilters
        searchStr={searchStr}
        onSearchChange={setSearchStr}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        baseData={baseData}
      />

      <div className="flex items-start gap-2 rounded-lg bg-blue-50/70 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          يتم تحميل التوصيلات من /api/courier/deliveries/today وطلبات اليوم من
          /api/courier/orders/today، ويتم تأكيد كل إجراء من الباكند.
        </span>
      </div>

      <div className="custom-scrollbar min-h-[400px] flex-1 overflow-y-auto rounded-2xl border bg-muted/5 bg-gradient-to-b from-transparent to-muted/5 p-4 md:min-h-0">
        <DeliveryList
          data={displayData}
          isLoading={isListLoading}
          onActionClick={handleActionClick}
          isActionLoading={actionMutation.isPending}
        />
      </div>
    </div>
  );
}
