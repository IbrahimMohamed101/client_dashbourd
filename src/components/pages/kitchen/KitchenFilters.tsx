import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { KitchenUiStatus, KitchenSubscriptionFilters } from "@/types/kitchenTypes";

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
  { value: "in_preparation", label: "قيد التحضير" },
  { value: "ready_for_pickup", label: "جاهز للاستلام" },
  { value: "out_for_delivery", label: "خرج للتوصيل" },
  { value: "fulfilled", label: "تم الاستلام" },
  { value: "no_show", label: "لم يحضر" },
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
      const activeEl = containerRef.current.querySelector('[data-state="active"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [statusFilter]);

  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-card p-4 rounded-xl border shadow-sm">
      <div className="relative w-full max-w-sm shrink-0">
        <Input
          placeholder="ابحث عن عميل أو المرجع..."
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          className="relative bg-muted/50 border-transparent hover:border-border transition-colors rounded-lg pl-10 pr-10 focus-visible:ring-1 h-10"
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      <div 
        ref={containerRef}
        className="flex w-full xl:w-auto items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }} // For Firefox
      >
        {statusOptions.map((opt) => {
          const count = filterCounts ? filterCounts[opt.value as keyof KitchenSubscriptionFilters] : undefined;
          const isActive = statusFilter === opt.value;
          
          return (
            <button
              key={opt.value}
              data-state={isActive ? "active" : "inactive"}
              onClick={() => setStatusFilter(opt.value)}
              className={`group flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-100"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground scale-100 hover:scale-[1.02]"
              }`}
            >
              {opt.label}
              {count !== undefined && (
                <span className={`inline-flex items-center justify-center min-w-5 h-5 rounded-full text-[11px] px-1 transition-colors ${
                  isActive 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-background/80 text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                }`}>
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
