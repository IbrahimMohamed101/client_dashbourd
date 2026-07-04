import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, Search, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import {
  useOneTimeOrderActionMutation,
  useOneTimeOrdersListQuery,
} from "@/hooks/useOneTimeOrdersQuery";
import type {
  OneTimeOrderAction,
  OneTimeOrderListItem,
  OneTimeOrderStatus,
} from "@/types/oneTimeOrderTypes";
import { isUnsupportedOneTimeOrderAction } from "@/types/oneTimeOrderTypes";
import { useDebounce } from "@/hooks/useDebounce";
import { useNewOrderDetection } from "@/hooks/useNewOrderDetection";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { OneTimeOrderConfirmDialog } from "./OneTimeOrderConfirmDialog";
import { OneTimeOrderDetailDialog } from "./OneTimeOrderDetailDialog";
import { getOneTimeOrdersColumns } from "./one-time-orders-columns";

const statusFilters: { value: OneTimeOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "confirmed", label: "مؤكد" },
  { value: "in_preparation", label: "قيد التحضير" },
  { value: "ready_for_pickup", label: "جاهز للاستلام" },
  { value: "fulfilled", label: "تم الاستلام" },
  { value: "cancelled", label: "ملغي" },
  { value: "expired", label: "منتهي الصلاحية" },
  { value: "pending_payment", label: "بانتظار الدفع" },
];

export const OneTimeOrderList: React.FC = () => {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<OneTimeOrderStatus | "all">(
    "all"
  );
  const [searchStr, setSearchStr] = useState("");
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const debouncedSearch = useDebounce(searchStr, 500);

  const [confirmDialog, setConfirmDialog] = useState<{
    order: OneTimeOrderListItem;
    action: OneTimeOrderAction;
    requiresPickupCode: boolean;
  } | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const { data: listRes, isLoading } = useOneTimeOrdersListQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    date,
    q: debouncedSearch || undefined,
    page: paginationState.pageIndex + 1,
    limit: paginationState.pageSize,
  });

  const actionMutation = useOneTimeOrderActionMutation();
  const orders = listRes?.data?.items ?? [];
  const pagination = listRes?.data?.pagination;

  const { resetDetection } = useNewOrderDetection({
    orders,
    enabled: true,
  });

  React.useEffect(() => {
    resetDetection();
  }, [statusFilter, date, resetDetection]);

  const resetToFirstPage = () => {
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const isActionRequiresConfirmation = (action: OneTimeOrderAction) => {
    return action === "fulfill" || action === "cancel";
  };

  const handleAction = React.useCallback(
    (order: OneTimeOrderListItem, action: OneTimeOrderAction) => {
      if (isUnsupportedOneTimeOrderAction(action)) return;

      if (order.paymentStatus !== "paid" && action === "prepare") return;

      if (isActionRequiresConfirmation(action)) {
        setConfirmDialog({
          order,
          action,
          requiresPickupCode: false,
        });
        return;
      }

      actionMutation.mutate({ orderId: order.entityId, action });
    },
    [actionMutation]
  );

  const handleView = React.useCallback(
    (order: OneTimeOrderListItem) => {
      setDetailOrderId(order.entityId);
    },
    []
  );

  const columns = React.useMemo(
    () =>
      getOneTimeOrdersColumns({
        onView: handleView,
        onAction: handleAction,
        isActionPending: actionMutation.isPending,
      }),
    [actionMutation.isPending, handleAction, handleView]
  );

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      pagination: paginationState,
    },
    pageCount: pagination?.pages ?? 1,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleConfirmAction = (
    body: import("@/types/oneTimeOrderTypes").OneTimeOrderActionRequest
  ) => {
    if (!confirmDialog) return;

    actionMutation.mutate({
      orderId: confirmDialog.order.entityId,
      action: confirmDialog.action,
      body,
    });

    setConfirmDialog(null);
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    resetToFirstPage();
  };

  const handleSearchChange = (value: string) => {
    setSearchStr(value);
    resetToFirstPage();
  };

  const handleStatusChange = (value: OneTimeOrderStatus | "all") => {
    setStatusFilter(value);
    resetToFirstPage();
  };

  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      <div className="mb-2 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShoppingBag className="h-6 w-6 text-purple-500" />
            طلبات لمرة واحدة
          </h1>
          <p className="text-muted-foreground">
            إدارة طلبات الاستلام من الفرع - منفصلة عن الاشتراكات
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarIcon className="absolute top-1/2 right-3 mr-1 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(event) => handleDateChange(event.target.value)}
              className="w-44 pr-10 text-right"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-sm shrink-0">
          <Input
            placeholder="ابحث برقم الطلب أو اسم العميل..."
            value={searchStr}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-10 rounded-lg border-transparent bg-muted/50 pr-10 pl-10 transition-colors hover:border-border focus-visible:ring-1"
          />
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div
          className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 xl:w-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {statusFilters.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end px-4 lg:px-6">
        <DataTableViewOptions table={table} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : table.getRowModel().rows.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="لا توجد طلبات"
          description="لا توجد طلبات لمرة واحدة لهذا اليوم أو تم تصفية جميع النتائج."
        />
      ) : (
        <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="py-4 text-right font-medium"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 text-right">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            table={table}
            totalItems={pagination?.total ?? orders.length}
            itemsLabel="الطلبات"
          />
        </div>
      )}

      <OneTimeOrderConfirmDialog
        open={!!confirmDialog}
        action={confirmDialog?.action ?? null}
        requiresPickupCode={confirmDialog?.requiresPickupCode ?? false}
        onClose={() => setConfirmDialog(null)}
        onConfirm={handleConfirmAction}
        isPending={actionMutation.isPending}
      />

      <OneTimeOrderDetailDialog
        open={!!detailOrderId}
        orderId={detailOrderId}
        onOpenChange={(open) => {
          if (!open) setDetailOrderId(null);
        }}
      />
    </div>
  );
};
