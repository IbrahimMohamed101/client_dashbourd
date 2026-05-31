import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { getCourierItems } from "@/lib/operationsBoard";
import { OperationsQueueTable } from "./OperationsQueueTable";

interface OperationsCourierBoardProps {
  items: UnifiedQueueItem[];
  isPending: boolean;
  onAction: (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous?: boolean
  ) => void;
}

export function OperationsCourierBoard({
  items = [],
  isPending,
  onAction,
}: OperationsCourierBoardProps) {
  const courierItems = getCourierItems(items);

  return (
    <OperationsQueueTable
      items={courierItems}
      isPending={isPending}
      onAction={onAction}
    />
  );
}
