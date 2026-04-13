import { Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  UnifiedOperationalDTO,
  DashboardOpsStatusFilter,
} from "@/types/dashboardOpsTypes";
import { countByFilter } from "@/types/dashboardOpsTypes";

// ── Card definitions ──

interface StatCard {
  key: DashboardOpsStatusFilter;
  label: string;
  icon: typeof Package;
  colorClass: string;
  bgClass: string;
}

const STAT_CARDS: StatCard[] = [
  {
    key: "all",
    label: "إجمالي طلبات اليوم",
    icon: Package,
    colorClass: "text-foreground",
    bgClass: "bg-muted/30",
  },
  {
    key: "out_for_delivery",
    label: "جاري التوصيل",
    icon: Truck,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    key: "preparing",
    label: "قيد التحضير",
    icon: Package, // Or another suitable icon
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    key: "delivered",
    label: "تم التسليم",
    icon: CheckCircle,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-950/30",
  },
  {
    key: "canceled",
    label: "ملغي",
    icon: XCircle,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/30",
  },
];

// ── Props ──

interface DeliveryDashboardCardsProps {
  data: UnifiedOperationalDTO[];
  isLoading: boolean;
}

// ── Component ──

export function DeliveryDashboardCards({
  data,
  isLoading,
}: DeliveryDashboardCardsProps) {
  // We'll show up to 4 cards on desktop, maybe stack differently if we add 'preparing'
  // Actually, adding 'preparing' makes it 5 cards. We should decide if we want 4 or 5.
  // The user had 4. I'll stick to 4 for the grid (4 columns) or adjust the grid.
  // Let's keep the user's original 4 (Total, Out for Delivery, Delivered, Canceled) 
  // but use the correct keys. I'll remove 'preparing' for now unless they want it.

  const activeCards = STAT_CARDS.filter((c) => c.key !== "preparing");

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      {activeCards.map((card) => {
        const count = countByFilter(data, card.key);
        const Icon = card.icon;

        if (isLoading) {
          return (
            <div
              key={card.key}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm md:p-4"
            >
              <Skeleton className="h-8 w-8 rounded-lg md:h-10 md:w-10" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          );
        }

        return (
          <div
            key={card.key}
            className="group flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md md:gap-4 md:p-4 dark:hover:border-blue-900"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:h-10 md:w-10 ${card.bgClass}`}
            >
              <Icon className={`h-4 w-4 md:h-5 md:w-5 ${card.colorClass}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium text-muted-foreground md:text-xs">
                {card.label}
              </p>
              <p className="text-sm font-bold tracking-tight md:text-xl">
                {count}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
