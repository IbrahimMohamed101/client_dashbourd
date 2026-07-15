import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/userTypes";
import { UserActionsCell } from "./user-actions-cell";
import { CustomerAuthStateBadge } from "./user-auth-state";
import { formatCustomerDateTime } from "./user-auth-utils";

export const usersColumns: ColumnDef<User>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="font-medium text-muted-foreground">{row.index + 1}</span>
    ),
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "fullName",
    header: "الاسم",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.fullName || "—"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "الجوال",
    cell: ({ row }) => (
      <span dir="ltr" className="font-medium">
        {row.original.phoneE164 || row.original.phone || "—"}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "البريد",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.email || "غير متوفر"}
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "حالة الحساب",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "نشط" : "غير نشط"}
      </Badge>
    ),
  },
  {
    id: "authState",
    header: "حالة الدخول",
    cell: ({ row }) => <CustomerAuthStateBadge user={row.original} />,
  },
  {
    accessorKey: "activeSubscriptionsCount",
    header: "الاشتراكات النشطة",
    cell: ({ row }) => (
      <span className="font-medium text-muted-foreground">
        {row.original.activeSubscriptionsCount} /{" "}
        {row.original.subscriptionsCount}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "تاريخ الإنشاء",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatCustomerDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "إجراءات",
    cell: ({ row }) => <UserActionsCell user={row.original} />,
    enableHiding: false,
    size: 80,
  },
];
