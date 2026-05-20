import type {
  DashboardOpsActionRequest,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

export const OPERATIONS_SCREENS = ["kitchen", "pickup", "courier"] as const;

export type OperationsScreen = (typeof OPERATIONS_SCREENS)[number];

export interface OperationsScreenConfig {
  label: string;
  screens: OperationsScreen[];
}

const ALL_OPERATIONS_SCREENS: OperationsScreen[] = [
  "kitchen",
  "pickup",
  "courier",
];

const ROLE_SCREEN_MAP: Record<string, OperationsScreenConfig> = {
  kitchen: {
    label: "المطبخ والاستلام",
    screens: ["kitchen", "pickup"],
  },
  courier: { label: "التوصيل", screens: ["courier"] },
  admin: {
    label: "جميع العمليات",
    screens: ALL_OPERATIONS_SCREENS,
  },
  superadmin: {
    label: "جميع العمليات",
    screens: ALL_OPERATIONS_SCREENS,
  },
};

export function getScreensForRole(
  role: string | null | undefined
): OperationsScreenConfig {
  if (!role) return { label: "", screens: [] };
  return ROLE_SCREEN_MAP[role] || { label: "", screens: [] };
}

export function getEndpointForAction(action: string): string {
  return `/api/dashboard/ops/actions/${action}`;
}

export function buildOperationsActionPayload(
  item: UnifiedQueueItem,
  action: string,
  reason?: string,
  notes?: string,
  pickupCode?: string
): DashboardOpsActionRequest {
  return {
    entityId: item.entityId,
    entityType: item.entityType,
    source: item.source,
    action,
    reason,
    note: notes,
    payload: {
      reason,
      notes,
      pickupCode,
    },
  };
}

export function getItemsByStatuses(
  items: UnifiedQueueItem[],
  statuses: readonly string[]
): UnifiedQueueItem[] {
  return items.filter((item) => statuses.includes(item.status));
}

export function getPickupItems(
  items: UnifiedQueueItem[]
): UnifiedQueueItem[] {
  return items.filter(
    (item) =>
      item.mode === "pickup" || (item.source === "one_time_order" && !item.mode)
  );
}

export function getCourierItems(
  items: UnifiedQueueItem[]
): UnifiedQueueItem[] {
  return items.filter(
    (item) =>
      item.mode === "delivery" && item.source !== "subscription_pickup_request"
  );
}
