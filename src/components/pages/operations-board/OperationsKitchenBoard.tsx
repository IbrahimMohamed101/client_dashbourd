import { useState } from "react";
import {
  CalendarDays,
  Lock,
  Clock,
  PackageCheck,
  Truck,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { OperationsQueueTable } from "./OperationsQueueTable";

interface OperationsKitchenBoardProps {
  items: UnifiedQueueItem[];
  isPending: boolean;
  onAction: (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous?: boolean
  ) => void;
}

type KitchenStatusFilter =
  | "all"
  | "not_prepared"
  | "open"
  | "locked"
  | "confirmed"
  | "in_preparation"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "fulfilled"
  | "no_show"
  | "pending_payment"
  | "cancelled"
  | "expired";

const statusOptions: { value: KitchenStatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "not_prepared", label: "لم يُحضّر" },
  { value: "open", label: "مفتوح" },
  { value: "locked", label: "مقفول" },
  { value: "confirmed", label: "مؤكد" },
  { value: "in_preparation", label: "قيد التحضير" },
  { value: "ready_for_pickup", label: "جاهز للاستلام" },
  { value: "out_for_delivery", label: "خرج للتوصيل" },
  { value: "fulfilled", label: "تم الاستلام" },
  { value: "no_show", label: "لم يحضر" },
  { value: "pending_payment", label: "بانتظار الدفع" },
  { value: "cancelled", label: "ملغي" },
  { value: "expired", label: "منتهي الصلاحية" },
];

function matchesKitchenFilter(
  itemStatus: string,
  filter: KitchenStatusFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "not_prepared") {
    return ["open", "locked", "confirmed"].includes(itemStatus);
  }
  return itemStatus === filter;
}

function computeCounts(items: UnifiedQueueItem[]) {
  const count = (predicate: (item: UnifiedQueueItem) => boolean) =>
    items.filter(predicate).length;

  return {
    total: items.length,
    subscriptionsToday: count(
      (i) => i.entityType === "subscription_day" || i.source === "subscription"
    ),
    lockedDays: count((i) => i.status === "locked"),
    inPreparation: count((i) => i.status === "in_preparation"),
    readyForPickup: count((i) => i.status === "ready_for_pickup"),
    outForDelivery: count((i) => i.status === "out_for_delivery"),
    fulfilled: count((i) => i.status === "fulfilled"),
    individualOrders: count(
      (i) => i.source === "one_time_order" || i.entityType === "order"
    ),
    notPrepared: count((i) =>
      ["open", "locked", "confirmed"].includes(i.status)
    ),
  };
}

export function OperationsKitchenBoard({
  items = [],
  isPending,
  onAction,
}: OperationsKitchenBoardProps) {
  const [statusFilter, setStatusFilter] = useState<KitchenStatusFilter>("all");
  const [localSearch, setLocalSearch] = useState("");

  const counts = computeCounts(items);

  const filteredItems = items.filter((item) => {
    const matchesStatus = matchesKitchenFilter(item.status, statusFilter);
    const matchesSearch = localSearch
      ? (item.customer?.name || "")
          .toLowerCase()
          .includes(localSearch.toLowerCase()) ||
        (item.reference || "")
          .toLowerCase()
          .includes(localSearch.toLowerCase()) ||
        (item.customer?.phone || "")
          .toLowerCase()
          .includes(localSearch.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const cards = [
    {
      title: "إجمالي العناصر",
      value: counts.total,
      icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
      color: "border-l-blue-500",
    },
    {
      title: "اشتراكات اليوم",
      value: counts.subscriptionsToday,
      icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
      color: "border-l-blue-500",
    },
    {
      title: "الأيام المقفولة",
      value: counts.lockedDays,
      icon: <Lock className="h-5 w-5 text-slate-500" />,
      color: "border-l-slate-500",
    },
    {
      title: "قيد التحضير",
      value: counts.inPreparation,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: "border-l-amber-500",
    },
    {
      title: "جاهز للاستلام",
      value: counts.readyForPickup,
      icon: <PackageCheck className="h-5 w-5 text-green-500" />,
      color: "border-l-green-500",
    },
    {
      title: "خرج للتوصيل",
      value: counts.outForDelivery,
      icon: <Truck className="h-5 w-5 text-indigo-500" />,
      color: "border-l-indigo-500",
    },
    {
      title: "الطلبات الفردية",
      value: counts.individualOrders,
      icon: <ShoppingBag className="h-5 w-5 text-purple-500" />,
      color: "border-l-purple-500",
    },
    {
      title: "تم الاستلام",
      value: counts.fulfilled,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      color: "border-l-emerald-500",
    },
    {
      title: "لم يُحضّر",
      value: counts.notPrepared,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      color: "border-l-red-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            className={`border-l-4 ${card.color} flex flex-col justify-between`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-sm shrink-0">
          <Input
            placeholder="ابحث في عناصر المطبخ..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="relative h-10 rounded-lg border-transparent bg-muted/50 pr-10 pl-10 transition-colors hover:border-border focus-visible:ring-1"
          />
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 xl:w-auto">
          {statusOptions.map((opt) => {
            const count = items.filter((i) =>
              matchesKitchenFilter(i.status, opt.value)
            ).length;
            const isActive = statusFilter === opt.value;

            return (
              <button
                key={opt.value}
                data-state={isActive ? "active" : "inactive"}
                onClick={() => setStatusFilter(opt.value)}
                className={`group flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "scale-100 border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "scale-100 border-transparent bg-muted text-muted-foreground hover:scale-[1.02] hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {opt.label}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] transition-colors ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/80 text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <OperationsQueueTable
        items={filteredItems}
        isPending={isPending}
        onAction={onAction}
      />
    </div>
  );
}

export default OperationsKitchenBoard;
