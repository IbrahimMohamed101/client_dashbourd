import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { getPickupItems } from "@/lib/operationsBoard";
import { OperationsQueueTable } from "./OperationsQueueTable";

interface OperationsPickupBoardProps {
  items: UnifiedQueueItem[];
  isPending: boolean;
  onAction: (
    item: UnifiedQueueItem,
    action: string,
    actionLabel: string,
    isDangerous?: boolean
  ) => void;
  onFulfill: (item: UnifiedQueueItem) => void;
}

export function OperationsPickupBoard({
  items = [],
  isPending,
  onAction,
  onFulfill,
}: OperationsPickupBoardProps) {
  const pickupItems = getPickupItems(items);

  return (
    <OperationsQueueTable
      items={pickupItems}
      isPending={isPending}
      onAction={onAction}
      onFulfill={onFulfill}
    />
  );
}
