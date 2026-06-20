import { PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryCard } from "./DeliveryCard";
import type {
  DashboardOpsActionRequest,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

interface DeliveryListProps {
  data: UnifiedQueueItem[];
  isLoading: boolean;
  onActionClick: (
    item: UnifiedQueueItem,
    action: string,
    payload: DashboardOpsActionRequest
  ) => void;
  isActionLoading: boolean;
}

export function DeliveryList({
  data,
  isLoading,
  onActionClick,
  isActionLoading,
}: DeliveryListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <PackageX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold">لا توجد توصيلات</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            لم يتم العثور على أي توصيلات مطابقة للبحث أو الفلتر المحدد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold opacity-80">جميع التوصيلات</h2>
        <span className="text-[10px] font-medium text-muted-foreground">
          {data.length} توصيل متاح
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {data.map((item) => (
          <DeliveryCard
            key={item.id}
            item={item}
            onActionClick={onActionClick}
            isActionLoading={isActionLoading}
          />
        ))}
      </div>
    </div>
  );
}
