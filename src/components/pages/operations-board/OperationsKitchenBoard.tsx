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

export function OperationsKitchenBoard({
  items,
  isPending,
  onAction,
}: OperationsKitchenBoardProps) {
  return (
    <OperationsQueueTable
      items={items}
      isPending={isPending}
      onAction={onAction}
    />
  );
}
