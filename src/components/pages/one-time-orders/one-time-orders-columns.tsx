import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Eye,
  PackageCheck,
  Play,
  Store,
  XCircle,
} from "lucide-react";
import { getOneTimeOrderRowActions } from "@/lib/oneTimeOrderActions";
import type {
  OneTimeOrderAction,
  OneTimeOrderListItem,
} from "@/types/oneTimeOrderTypes";
import { OneTimeOrderPaymentBadge } from "./OneTimeOrderPaymentBadge";
import { OneTimeOrderStatusBadge } from "./OneTimeOrderStatusBadge";

interface OneTimeOrdersColumnsOptions {
  onView: (order: OneTimeOrderListItem) => void;
  onAction: (order: OneTimeOrderListItem, action: OneTimeOrderAction) => void;
  isActionPending: boolean;
}

const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    icon: ReactNode;
    variant: "default" | "secondary" | "destructive";
  }
> = {
  prepare: {
    label: "بدء التحضير",
    icon: <Play className="ml-1 h-3.5 w-3.5" />,
    variant: "default",
  },
  ready_for_pickup: {
    label: "جاهز للاستلام",
    icon: <PackageCheck className="ml-1 h-3.5 w-3.5" />,
    variant: "secondary",
  },
  fulfill: {
    label: "تم الاستلام",
    icon: <CheckCircle2 className="ml-1 h-3.5 w-3.5" />,
    variant: "default",
  },
  cancel: {
    label: "إلغاء",
    icon: <XCircle className="ml-1 h-3.5 w-3.5" />,
    variant: "destructive",
  },
};

function getActionConfig(action: OneTimeOrderAction) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action,
      icon: null,
      variant: "secondary" as const,
    }
  );
}

function getItemName(item: OneTimeOrderListItem["items"][number]) {
  if (typeof item.name === "string") return item.name;
  const localizedName = item.name as unknown as Record<string, string>;
  return localizedName?.ar || localizedName?.en || "وجبة";
}

function getItemQuantity(item: OneTimeOrderListItem["items"][number]) {
  const withQty = item as OneTimeOrderListItem["items"][number] & {
    qty?: number;
  };
  return item.quantity ?? withQty.qty ?? 1;
}

export function getOneTimeOrdersColumns({
  onView,
  onAction,
  isActionPending,
}: OneTimeOrdersColumnsOptions): ColumnDef<OneTimeOrderListItem>[] {
  return [
    {
      accessorKey: "orderNumber",
      header: "رقم الطلب",
      cell: ({ row }) => (
        <span className="rounded-md bg-purple-500/10 px-2 py-1 font-mono text-xs font-bold text-purple-600">
          {row.original.orderNumber}
        </span>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "customer.name",
      header: "العميل",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="max-w-40 truncate text-sm font-medium">
            {row.original.customer?.name || "-"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.customer?.phone || ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "fulfillmentMethod",
      header: "النوع",
      cell: () => (
        <Badge
          variant="secondary"
          className="gap-1 border-purple-500/20 bg-purple-500/10 text-purple-600"
        >
          <Store className="h-3 w-3" />
          استلام
        </Badge>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "الدفع",
      cell: ({ row }) => (
        <OneTimeOrderPaymentBadge status={row.original.paymentStatus} />
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => <OneTimeOrderStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "items",
      header: "الوجبات",
      cell: ({ row }) => {
        const items = row.original.items ?? [];

        if (items.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }

        return (
          <div className="flex max-w-72 flex-wrap gap-1">
            {items.slice(0, 3).map((item, index) => (
              <span
                key={item.id ?? `${getItemName(item)}-${index}`}
                className="inline-flex items-center gap-1 rounded-md border border-secondary bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {getItemName(item)} x{getItemQuantity(item)}
              </span>
            ))}
            {items.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{items.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => {
        const order = row.original;
        const actions = getOneTimeOrderRowActions(order);

        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onView(order)}
            >
              <Eye className="ml-1 h-3.5 w-3.5" />
              التفاصيل
            </Button>

            {actions.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                لا توجد إجراءات حالة
              </span>
            ) : (
              actions.map((action) => {
                const config = getActionConfig(action);
                return (
                  <Button
                    key={action}
                    variant={config.variant}
                    size="sm"
                    className="h-8 px-3 text-xs shadow-sm transition-all active:scale-95"
                    onClick={() => onAction(order, action)}
                    disabled={isActionPending}
                  >
                    {config.icon}
                    {config.label}
                  </Button>
                );
              })
            )}
          </div>
        );
      },
      enableHiding: false,
    },
  ];
}
