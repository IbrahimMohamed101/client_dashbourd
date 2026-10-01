import type { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { Subscription } from "@/types/subscriptionTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, History, ReceiptText, Settings2 } from "lucide-react";
import {
  currentStackingAggregateBalance,
  subscriptionPlanLabel,
  subscriptionRelationshipLabel,
  subscriptionPurchaseCount,
} from "@/lib/subscriptionStackingPresentation";

interface SubscriptionsColumnsOptions {
  onView: (subscription: Subscription) => void;
  onInvoice: (subscription: Subscription) => void;
  onPurchaseHistory: (subscription: Subscription) => void;
}

export function getSubscriptionsColumns({
  onView,
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
          <Badge
            variant={
              row.original.stacking?.isCombinedPackage ? "default" : "outline"
            }
          >
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
      cell: ({ row }) => {
        const subscription = row.original;
        const subscriptionId = subscription._id || subscription.id;

        return (
          <div className="flex min-w-[310px] flex-wrap items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 font-semibold"
              onClick={() => onInvoice(subscription)}
            >
              <ReceiptText className="size-4" />
              الفاتورة
            </Button>

            {subscriptionPurchaseCount(subscription) > 1 ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => onPurchaseHistory(subscription)}
              >
                <History className="size-4" />
                المشتريات
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onView(subscription)}
            >
              <EyeIcon className="size-4" />
              التفاصيل
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 font-semibold"
              asChild
            >
              <Link
                to="/subscriptions/$subscriptionId"
                params={{ subscriptionId }}
              >
                <Settings2 className="size-4" />
                إدارة الاشتراك
              </Link>
            </Button>
          </div>
        );
      },
      enableHiding: false,
    },
  ];
}
