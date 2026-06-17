import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type {
  DashboardRecentOrder,
  DashboardRecentSubscription,
} from "@/types/dashboardHomeTypes";

function displayValue(value: unknown) {
  return value == null || value === "" ? "-" : String(value);
}

export const subscriptionColumns: ColumnDef<DashboardRecentSubscription>[] = [
  {
    accessorKey: "userName",
    header: "المستخدم",
    cell: ({ row }) => displayValue(row.original.userName),
  },
  {
    accessorKey: "planName",
    header: "الخطة",
    cell: ({ row }) => displayValue(row.original.planName),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge variant="secondary" className="max-w-36 truncate">
        {displayValue(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "startDate",
    header: "تاريخ البدء",
    cell: ({ row }) => displayValue(row.original.startDate),
  },
  {
    accessorKey: "amountDisplay",
    header: "المبلغ",
    cell: ({ row }) => displayValue(row.original.amountDisplay),
  },
  {
    accessorKey: "createdAt",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => displayValue(row.original.createdAt),
  },
];

export const orderColumns: ColumnDef<DashboardRecentOrder>[] = [
  {
    accessorKey: "displayId",
    header: "ID",
    cell: ({ row }) => displayValue(row.original.displayId ?? row.original.id),
  },
  {
    accessorKey: "userName",
    header: "المستخدم",
    cell: ({ row }) => displayValue(row.original.userName),
  },
  {
    accessorKey: "itemsSummary",
    header: "الوجبات",
    cell: ({ row }) => displayValue(row.original.itemsSummary),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge variant="secondary" className="max-w-36 truncate">
        {displayValue(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "date",
    header: "تاريخ التوصيل",
    cell: ({ row }) => displayValue(row.original.date),
  },
  {
    accessorKey: "amountDisplay",
    header: "المبلغ",
    cell: ({ row }) => displayValue(row.original.amountDisplay),
  },
];
