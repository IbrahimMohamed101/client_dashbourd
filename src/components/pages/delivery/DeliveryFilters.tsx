import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  DashboardOpsStatusFilter,
  UnifiedOperationalDTO,
} from "@/types/dashboardOpsTypes";
import { countByFilter } from "@/types/dashboardOpsTypes";

// ── Tab definitions ──

const FILTER_TABS: {
  label: string;
  value: DashboardOpsStatusFilter;
}[] = [
  { label: "الكل", value: "all" },
  { label: "قيد التحضير", value: "preparing" },
  { label: "جاري التوصيل", value: "out_for_delivery" },
  { label: "تم التسليم", value: "delivered" },
  { label: "ملغي", value: "canceled" },
];

// ── Props ──

interface DeliveryFiltersProps {
  searchStr: string;
  onSearchChange: (val: string) => void;
  statusFilter: DashboardOpsStatusFilter;
  onStatusChange: (val: DashboardOpsStatusFilter) => void;
  baseData: UnifiedOperationalDTO[];
}

// ── Component ──

export function DeliveryFilters({
  searchStr,
  onSearchChange,
  statusFilter,
  onStatusChange,
  baseData,
}: DeliveryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between">
      {/* Search Bar */}
      <div className="relative w-full md:w-[70%]">
        <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ابحث بالاسم، رقم الهاتف، أو رقم المرجع..."
          value={searchStr}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-h-12 w-full border-muted bg-card pr-10 text-sm shadow-sm"
        />
      </div>

      {/* Segmented Tabs */}
      <div className="relative w-full overflow-hidden md:w-fit">
        {/* Scroll hint gradient (mobile only) */}
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l from-muted/50 to-transparent lg:hidden" />

        <div className="custom-scrollbar no-scrollbar flex w-full overflow-x-auto rounded-full bg-muted/50 p-1 lg:w-fit">
          {FILTER_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = countByFilter(baseData, tab.value);

            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={`flex min-w-max items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all md:px-5 md:text-sm ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] md:h-5 md:min-w-5 md:text-xs ${
                    isActive
                      ? "bg-muted text-muted-foreground"
                      : "bg-background/50 text-muted-foreground/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
