import type { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Subscription } from "@/types/subscriptionTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, History, ReceiptText } from "lucide-react";
import {
  currentStackingAggregateBalance,
  subscriptionPlanLabel,
  subscriptionRelationshipLabel,
  subscriptionPurchaseCount,
} from "@/lib/subscriptionStackingPresentation";

interface SubscriptionsColumnsOptions {
  onInvoice: (subscription: Subscription) => void;
  onPurchaseHistory: (subscription: Subscription) => void;
}

export function getSubscriptionsColumns({
  onInvoice,
  onPurchaseHistory,
}: SubscriptionsColumnsOptions): ColumnDef<Subscription>[] {
  return [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">
          {row.index + 1}
        </span>
      ),
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "displayId",
      header: "معرف الاشتراك",
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.displayId}</span>
      ),
    },
    {
      accessorKey: "userName",
      header: "اسم المشترك",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.userName}</span>
      ),
    },
    {
      accessorKey: "planName",
      header: "اسم الباقة",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {subscriptionPlanLabel(row.original)}
        </span>
      ),
    },
    {
      id: "relationship",
      header: "نوع الاشتراك",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <Badge variant={row.original.stacking?.isCombinedPackage ? "default" : "outline"}>
            {subscriptionRelationshipLabel(row.original)}
          </Badge>
          {subscriptionPurchaseCount(row.original) > 1 ? (
            <span className="text-xs text-muted-foreground">
              {subscriptionPurchaseCount(row.original)} مشتريات
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.status;
        let label = status;
        let variant: ComponentProps<typeof Badge>["variant"] = "default";

        switch (status) {
          case "active":
            label = "نشط";
            variant = "default";
            break;
          case "pending":
            label = "قيد الانتظار";
            variant = "outline";
            break;
          case "canceled":
            label = "ملغى";
            variant = "destructive";
            break;
          case "expired":
          case "ended":
            label = "منتهي";
            variant = "secondary";
            break;
        }

        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      id: "meals",
      header: "الوجبات (متبقي/إجمالي)",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">
          {(() => {
            const aggregate = currentStackingAggregateBalance(row.original);
            return aggregate
              ? aggregate.remainingMeals + " / " + aggregate.totalMeals
              : row.original.remainingMeals + " / " + row.original.totalMeals;
          })()}
        </span>
      ),
    },
    {
      accessorKey: "startDate",
      header: "تاريخ البدء",
      cell: ({ row }) => {
        const date = new Date(row.original.startDate);
        return (
          <span className="text-muted-foreground">
            {date.toLocaleDateString("ar-EG")}
          </span>
        );
      },
    },
    {
      accessorKey: "endDate",
      header: "تاريخ الانتهاء",
      cell: ({ row }) => {
        const date = new Date(row.original.endDate);
        return (
          <span className="text-muted-foreground">
            {date.toLocaleDateString("ar-EG")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 font-semibold"
            onClick={() => onInvoice(row.original)}
          >
            <ReceiptText className="size-4" />
            الفاتورة
          </Button>

          {subscriptionPurchaseCount(row.original) > 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onPurchaseHistory(row.original)}
            >
              <History className="size-4" />
              المشتريات
            </Button>
          ) : null}

          <Button variant="outline" size="sm" asChild>
            <Link
              to="/subscriptions/$subscriptionId"
              params={{ subscriptionId: row.original._id || row.original.id }}
            >
              <EyeIcon className="ml-1 size-4" />
              إدارة الاشتراك
            </Link>
          </Button>
        </div>
      ),
      enableHiding: false,
    },
  ];
}
