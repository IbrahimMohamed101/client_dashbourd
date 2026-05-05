import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type {
  KitchenUiStatus,
  KitchenSubscriptionFilters,
} from "@/types/kitchenTypes";

interface KitchenFiltersProps {
  searchStr: string;
  setSearchStr: (s: string) => void;
  statusFilter: KitchenUiStatus | "all";
  setStatusFilter: (s: KitchenUiStatus | "all") => void;
  filterCounts?: KitchenSubscriptionFilters;
}

const statusOptions: { value: KitchenUiStatus | "all"; label: string }[] = [
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

export const KitchenFilters: React.FC<KitchenFiltersProps> = ({
  searchStr,
  setSearchStr,
  statusFilter,
  setStatusFilter,
  filterCounts,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active filter on mobile/smaller screens
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector(
        '[data-state="active"]'
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [statusFilter]);

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full max-w-sm shrink-0">
        <Input
          placeholder="ابحث عن عميل أو المرجع..."
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          className="relative h-10 rounded-lg border-transparent bg-muted/50 pr-10 pl-10 transition-colors hover:border-border focus-visible:ring-1"
        />
        <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div
        ref={containerRef}
        className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex w-full items-center gap-1.5 overflow-x-auto pb-1 xl:w-auto"
        style={{ scrollbarWidth: "thin" }} // For Firefox
      >
        {statusOptions.map((opt) => {
          const count = filterCounts
            ? filterCounts[opt.value as keyof KitchenSubscriptionFilters]
            : undefined;
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
              {count !== undefined && (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] transition-colors ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/80 text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
