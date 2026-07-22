import { PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryCard } from "./DeliveryCard";
import type {
  DashboardOpsActionRequest,
  QueueAction,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

interface DeliveryListProps {
  data: UnifiedQueueItem[];
  isLoading: boolean;
  onActionClick: (
    item: UnifiedQueueItem,
    action: QueueAction,
    payload: DashboardOpsActionRequest
  ) => void;
  pendingItemId?: string | null;
  emptyMessage?: string;
}

export function DeliveryList({
  data,
  isLoading,
  onActionClick,
  pendingItemId,
  emptyMessage,
}: DeliveryListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <PackageX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold">لا توجد توصيلات</h3>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {emptyMessage || "لا توجد توصيلات في يوم التشغيل الحالي."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-semibold opacity-80">جميع التوصيلات</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {data.length} توصيل
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {data.map((item) => (
          <DeliveryCard
            key={item.id}
            item={item}
            onActionClick={onActionClick}
            isActionLoading={pendingItemId === item.id}
          />
        ))}
      </div>
    </div>
  );
}
