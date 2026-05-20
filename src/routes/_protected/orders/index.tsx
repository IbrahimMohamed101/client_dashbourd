import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KitchenDashboardCards } from "@/components/pages/kitchen/KitchenDashboardCards";
import { KitchenFilters } from "@/components/pages/kitchen/KitchenFilters";
import { KitchenTabs } from "@/components/pages/kitchen/KitchenTabs";
import { KitchenDataTable } from "@/components/pages/kitchen/KitchenDataTable";

import {
  useKitchenSummaryQuery,
  useKitchenOperationsQuery,
  useKitchenActionMutation,
} from "@/hooks/useKitchenQuery";
import type {
  KitchenOperationsTab,
  KitchenUiStatus,
  KitchenRowAction,
} from "@/types/kitchenTypes";
import { useDebounce } from "@/hooks/useDebounce";

export const Route = createFileRoute("/_protected/orders/")({
  component: KitchenDashboard,
});

function KitchenDashboard() {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState<KitchenOperationsTab>(
    "daily_subscriptions"
  );
  const [statusFilter, setStatusFilter] = useState<KitchenUiStatus | "all">(
    "all"
  );
  const [searchStr, setSearchStr] = useState("");
  const debouncedSearch = useDebounce(searchStr, 500);

  // ── Queries ──
  const { data: summaryRes, isLoading: isSummaryLoading } =
    useKitchenSummaryQuery(date);
  const { data: listRes, isLoading: isListLoading } = useKitchenOperationsQuery(
    {
      date,
      tab: activeTab,
      status: statusFilter,
      search: debouncedSearch,
      page: 1,
      limit: 50,
    }
  );

  // ── Mutations ──
  const actionMutation = useKitchenActionMutation();

  // ── Handlers ──
  const handleActionClick = (
    action: KitchenRowAction,
    actionData?: Record<string, unknown>
  ) => {
    actionMutation.mutate({
      endpoint: action.endpoint,
      method: action.method,
      body: actionData,
    });
  };

  // ── Extract data safely ──
  const summaryData = summaryRes?.data;
  const rows = listRes?.data?.rows || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">عمليات المطبخ</h1>
          <p className="text-muted-foreground">
            إدارة عبء العمل اليومي والطلبات والاستلام من الفرع
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarIcon className="absolute top-1/2 right-3 mr-1 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44 pr-10 text-right"
            />
          </div>
        </div>
      </div>

      {/* Dashboard cards */}
      <KitchenDashboardCards
        summary={summaryData?.summary}
        tabs={summaryData?.tabs}
        filters={summaryData?.subscriptionFilters}
        isLoading={isSummaryLoading}
      />

      {/* Filters */}
      <KitchenFilters
        searchStr={searchStr}
        setSearchStr={setSearchStr}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        filterCounts={summaryData?.subscriptionFilters}
      />

      {/* Tabs */}
      <KitchenTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabCounts={summaryData?.tabs}
      />

      <KitchenDataTable
        data={rows}
        isLoading={isListLoading}
        onActionClick={handleActionClick}
        isActionLoading={actionMutation.isPending}
      />
    </div>
  );
}
