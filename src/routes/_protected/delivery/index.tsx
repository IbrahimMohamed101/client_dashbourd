import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeliveryDashboardCards } from "@/components/pages/delivery/DeliveryDashboardCards";
import { DeliveryFilters } from "@/components/pages/delivery/DeliveryFilters";
import { DeliveryList } from "@/components/pages/delivery/DeliveryList";
import {
  useDashboardOpsListQuery,
  useDashboardOpsSearchQuery,
  useDashboardOpsActionMutation,
} from "@/hooks/useDashboardOpsQuery";
import type {
  DashboardOpsStatusFilter,
  DashboardOpsActionRequest,
} from "@/types/dashboardOpsTypes";
import { matchesStatusFilter } from "@/types/dashboardOpsTypes";
import { useDebounce } from "@/hooks/useDebounce";

// ── Route definition ──

export const Route = createFileRoute("/_protected/delivery/")({
  component: DeliveryDashboard,
});

// ── Page component ──

function DeliveryDashboard() {
  // ── Local state ──
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] =
    useState<DashboardOpsStatusFilter>("all");
  const [searchStr, setSearchStr] = useState("");

  const debouncedSearch = useDebounce(searchStr, 400);

  // ── Server state ──
  const { data: listRes, isLoading: isListLoading } =
    useDashboardOpsListQuery(date);
    

  const isSearching = debouncedSearch.length >= 3;
  const { data: searchRes, isLoading: isSearchLoading } =
    useDashboardOpsSearchQuery(debouncedSearch);

  const actionMutation = useDashboardOpsActionMutation();

  // ── Derived data ──
  const baseData = listRes?.data?.items ?? [];

  const getDisplayData = () => {
    if (isSearching) return searchRes?.data?.items ?? [];
    if (statusFilter === "all") return baseData;
    return baseData.filter((item) =>
      matchesStatusFilter(item.status, statusFilter),
    );
  };

  const displayData = getDisplayData();
  const isMainLoading = isListLoading || (isSearching && isSearchLoading);

  // ── Handlers ──
  const handleActionClick = (
    action: string,
    payload: DashboardOpsActionRequest,
  ) => {
    actionMutation.mutate({ action, payload });
  };

  // ── Render ──
  return (
    <div className="flex h-auto min-h-full flex-col gap-3 px-4 md:h-[calc(100vh-var(--header-height)-3rem)] md:overflow-hidden md:gap-4 md:px-6 md:pt-4 pb-6 md:pb-0">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between md:pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            التوصيل
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            إدارة ومتابعة عمليات التوصيل اليومية
          </p>
        </div>
        <div className="relative w-full md:w-auto">
          <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 w-full bg-card pr-10 text-right shadow-sm md:h-9 md:w-44"
          />
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <DeliveryDashboardCards data={baseData} isLoading={isListLoading} />

      {/* ── Filters & Search ── */}
      <DeliveryFilters
        searchStr={searchStr}
        onSearchChange={setSearchStr}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        baseData={baseData}
      />

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50/70 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          قائمة مشتركة لجميع طلبات التوصيل اليوم. يتم تحديثها تلقائياً كل 30
          ثانية.
        </span>
      </div>

      {/* ── Grid Container ── */}
      <div className="min-h-[400px] md:min-h-0 flex-1 overflow-y-auto rounded-2xl border bg-muted/5 bg-gradient-to-b from-transparent to-muted/5 p-4 custom-scrollbar">
        <DeliveryList
          data={displayData}
          isLoading={isMainLoading}
          onActionClick={handleActionClick}
          isActionLoading={actionMutation.isPending}
        />
      </div>
    </div>
  );
}
