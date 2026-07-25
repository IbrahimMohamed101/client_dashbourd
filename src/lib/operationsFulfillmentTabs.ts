import { getAllDeliveryOperationItems } from "@/lib/deliveryOperations";
import { getPickupItems } from "@/lib/operationsBoard";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

export interface OperationsFulfillmentTabs {
  pickup: UnifiedQueueItem[];
  courier: UnifiedQueueItem[];
}

/**
 * Fulfillment tabs are persistent views of the order's fulfillment method.
 * They are intentionally not mutually exclusive with the kitchen preparation
 * view: a delivery order can be visible in both Kitchen and Delivery while it
 * is being prepared, and the same rule applies to branch pickup orders.
 */
export function partitionOperationsFulfillmentTabs(
  items: UnifiedQueueItem[] = []
): OperationsFulfillmentTabs {
  return {
    pickup: getPickupItems(items),
    courier: getAllDeliveryOperationItems(items),
  };
}
