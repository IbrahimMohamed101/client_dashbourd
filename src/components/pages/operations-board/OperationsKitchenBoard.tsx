import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { OperationsQueueCharts } from "./OperationsQueueCharts";
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

export function OperationsKitchenBoard({
  items = [],
  isPending,
  onAction,
}: OperationsKitchenBoardProps) {
  const [statusFilter, setStatusFilter] = useState<KitchenStatusFilter>("all");
  const [localSearch, setLocalSearch] = useState("");

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

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <OperationsQueueCharts
        items={items}
        title="ضغط المطبخ اليوم"
        description="توزيع حالات التحضير ومصادر الطلبات بدلا من كروت أرقام كثيرة."
      />

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-3 shadow-sm sm:p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full shrink-0 xl:max-w-sm">
          <Input
            placeholder="ابحث في عناصر المطبخ..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="relative h-10 rounded-lg border-transparent bg-muted/50 pr-10 pl-10 transition-colors hover:border-border focus-visible:ring-1"
          />
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="-mx-1 flex w-full items-center gap-1.5 overflow-x-auto px-1 pb-1 xl:mx-0 xl:w-auto xl:px-0">
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
                className={`group flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
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

      <OperationsQueueTable
        items={filteredItems}
        isPending={isPending}
        onAction={onAction}
      />
    </div>
  );
}

export default OperationsKitchenBoard;
