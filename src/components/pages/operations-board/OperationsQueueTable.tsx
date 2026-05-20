import {
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  PackageOpen,
  Phone,
  RotateCcw,
  Search,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isOneTimeOrder, isPickupRequest } from "@/types/dashboardOpsTypes";

interface OperationsQueueTableProps {
  items: UnifiedQueueItem[];
  isPending: boolean;
  onAction: (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous?: boolean
  ) => void;
  onFulfill?: (item: UnifiedQueueItem) => void;
}

const actionIcons: Record<string, ReactNode> = {
  start_preparation: <ChefHat className="ml-1.5 h-3.5 w-3.5" />,
  prepare: <ChefHat className="ml-1.5 h-3.5 w-3.5" />,
  ready_for_pickup: <PackageCheck className="ml-1.5 h-3.5 w-3.5" />,
  dispatch: <Truck className="ml-1.5 h-3.5 w-3.5" />,
  notify_arrival: <Bell className="ml-1.5 h-3.5 w-3.5" />,
  fulfill: <CheckCircle2 className="ml-1.5 h-3.5 w-3.5" />,
  cancel: <XCircle className="ml-1.5 h-3.5 w-3.5" />,
  no_show: <XCircle className="ml-1.5 h-3.5 w-3.5" />,
  reopen: <RotateCcw className="ml-1.5 h-3.5 w-3.5" />,
};

function getStatusClasses(status: string) {
  if (["fulfilled", "ready_for_pickup", "ready"].includes(status)) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (["in_preparation", "preparing"].includes(status)) {
    return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }
  if (["out_for_delivery"].includes(status)) {
    return "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
  }
  if (
    ["canceled", "cancelled", "delivery_canceled", "canceled_at_branch", "no_show"].includes(
      status
    )
  ) {
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function getActionVariant(color: string) {
  if (color === "red" || color === "danger") return "destructive";
  if (color === "gray") return "secondary";
  return "default";
}

function getSourceLabel(item: UnifiedQueueItem) {
  if (isPickupRequest(item)) return "طلب استلام اشتراك";
  if (isOneTimeOrder(item)) return "طلب فردي";
  return "اشتراك يومي";
}

function getModeLabel(mode: string) {
  return mode === "delivery" ? "توصيل" : "استلام";
}

function getDisplayName(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const localized = value as { ar?: string; en?: string; name?: string };
    return localized.ar || localized.en || localized.name || "عنصر";
  }
  return "عنصر";
}

function getDisplayQuantity(entry: unknown) {
  if (!entry || typeof entry !== "object") return 1;
  const item = entry as { quantity?: number; qty?: number };
  return Number(item.quantity || item.qty || 1);
}

function getItemNames(item: UnifiedQueueItem) {
  if (item.items?.length) {
    return item.items.map((entry, index) => ({
      id: String(entry.id || getDisplayName(entry.name) || index),
      name: getDisplayName(entry.name),
      quantity: getDisplayQuantity(entry),
    }));
  }

  if (item.mealSlots?.length) {
    return item.mealSlots.flatMap((slot) =>
      slot.items.map((entry, index) => ({
        id: `${slot.slot}-${getDisplayName(entry.name)}-${index}`,
        name: getDisplayName(entry.name),
        quantity: getDisplayQuantity(entry),
      }))
    );
  }

  if (item.context?.mealCount) {
    return [
      {
        id: "meal-count",
        name: "وجبات محجوزة",
        quantity: item.context.mealCount,
      },
    ];
  }

  return [];
}

const columnHelper = createColumnHelper<UnifiedQueueItem>();

export function OperationsQueueTable({
  items,
  isPending,
  onAction,
  onFulfill,
}: OperationsQueueTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});

  const columns = [
    columnHelper.display({
      id: "customer",
      header: "العميل",
      enableHiding: true,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-sm font-bold text-primary uppercase">
              {item.customer?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {item.customer?.name || "—"}
              </p>
              <p
                className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"
                dir="ltr"
              >
                <Phone className="h-3 w-3" />
                {item.customer?.phone || "—"}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "reference",
      header: "المرجع",
      enableHiding: true,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium">
            {item.orderNumber || item.reference || item.entityId}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "type",
      header: "النوع",
      enableHiding: true,
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-md">
          {getSourceLabel(row.original)}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: "mode",
      header: "المسار",
      enableHiding: true,
      cell: ({ row }) => {
        const mode = row.original.mode;
        return (
          <Badge
            variant="outline"
            className={
              mode === "delivery"
                ? "gap-1 border-sky-500/20 bg-sky-500/10 text-sky-700"
                : "gap-1 border-purple-500/20 bg-purple-500/10 text-purple-700"
            }
          >
            {mode === "delivery" ? (
              <Truck className="h-3 w-3" />
            ) : (
              <Store className="h-3 w-3" />
            )}
            {getModeLabel(mode)}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "time",
      header: "الوقت",
      enableHiding: true,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {item.context?.window || item.delivery?.deliveryWindow || "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "items",
      header: "العناصر",
      enableHiding: true,
      cell: ({ row }) => {
        const itemNames = getItemNames(row.original);
        if (!itemNames.length) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {itemNames.slice(0, 4).map((entry) => (
              <span
                key={entry.id}
                className="rounded-md border border-secondary bg-secondary/50 px-2 py-1 text-[11px] font-medium"
              >
                {entry.name} x{entry.quantity}
              </span>
            ))}
            {itemNames.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{itemNames.length - 4}
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "status",
      header: "الحالة",
      enableHiding: true,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Badge
            variant="outline"
            className={`rounded-md ${getStatusClasses(item.status)}`}
          >
            {item.statusLabel || item.ui?.label || item.status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "الإجراءات",
      enableHiding: true,
      cell: ({ row }) => {
        const item = row.original;
        if (!item.allowedActions?.length) {
          return (
            <span className="inline-flex rounded-md bg-muted/30 px-3 py-1 text-sm text-muted-foreground">
              —
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-2">
            {item.allowedActions.map((action) => (
              <Button
                key={action.id}
                variant={getActionVariant(action.color)}
                size="sm"
                className="h-8 px-3 text-xs font-semibold"
                disabled={isPending}
                onClick={() => {
                  if (
                    action.id === "fulfill" &&
                    item.mode === "pickup" &&
                    onFulfill
                  ) {
                    onFulfill(item);
                    return;
                  }
                  onAction(
                    item,
                    action.id,
                    action.label,
                    action.color === "red" || action.color === "danger"
                  );
                }}
              >
                {actionIcons[action.id]}
                {action.label}
              </Button>
            ))}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  if (!items.length) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="لا توجد طلبات"
        description="لا توجد طلبات مطابقة في هذا المسار حاليا."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث في الطلبات..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pr-9"
          />
        </div>
        <DataTableViewOptions table={table} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/50 bg-muted/40 hover:bg-muted/40"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-right font-semibold"
                    style={{
                      width:
                        header.column.id === "customer"
                          ? 220
                          : header.column.id === "items"
                            ? 280
                            : header.column.id === "actions"
                              ? 240
                              : undefined,
                    }}
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
                className="border-b-border/40 transition-colors hover:bg-muted/30"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} itemsLabel="طلب" />
    </div>
  );
}

export default OperationsQueueTable;
