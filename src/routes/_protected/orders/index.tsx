/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Lock, CalendarIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KitchenDashboardCards } from "@/components/pages/kitchen/KitchenDashboardCards";
import { KitchenFilters } from "@/components/pages/kitchen/KitchenFilters";
import { KitchenTabs } from "@/components/pages/kitchen/KitchenTabs";
import { KitchenDataTable } from "@/components/pages/kitchen/KitchenDataTable";

import {
  useKitchenSummaryQuery,
  useKitchenOperationsQuery,
  useKitchenActionMutation,
  useBulkLockMutation,
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
  const bulkLockMutation = useBulkLockMutation();

  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  const handleBulkLock = () => {
    bulkLockMutation.mutate(date, {
      onSuccess: () => {
        setIsLockDialogOpen(false);
      },
    });
  };

  // ── Handlers ──
  const handleActionClick = (action: KitchenRowAction, actionData?: any) => {
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
          <Button
            onClick={() => setIsLockDialogOpen(true)}
            disabled={bulkLockMutation.isPending}
            variant="secondary"
            className="bg-[#1C1C1E] text-white hover:bg-[#2C2C2E]"
          >
            <Lock className="ml-2 h-4 w-4" />
            قفل كل الأيام
          </Button>
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

      {/* Bulk Lock Confirmation Dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد قفل اليوم
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base text-foreground/80">
              هل أنت متأكد من رغبتك في قفل جميع اشتراكات يوم{" "}
              <span className="mx-1 font-bold text-foreground" dir="ltr">
                {date}
              </span>
              ؟ <br />
              بمجرد قفل اليوم، سيتم إرسال التحديثات ولا يمكن التراجع عن معظم
              الإجراءات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-5">
            <AlertDialogCancel
              disabled={bulkLockMutation.isPending}
              className="mt-0"
            >
              إلغاء
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBulkLock}
              disabled={bulkLockMutation.isPending}
            >
              {bulkLockMutation.isPending
                ? "جاري القفل..."
                : "نعم، قفل الطلبات"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
