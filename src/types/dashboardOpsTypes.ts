// ── DTO returned by the unified ops API ──

export interface UnifiedOperationalDTO {
  id: string;
  type: "subscription" | "order";
  source?: "subscription" | "one_time_order";
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  context: {
    date: string;
    window?: string;
    addressSummary?: string;
    pickupCode?: string;
    notes?: string;
    cancelInfo?: {
      reason: string;
      note?: string;
    };
    orderDetails?: string;
  };
  allowedActions: string[];
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

// ── API response wrappers ──

export interface DashboardOpsListResponse {
  status: boolean;
  data: UnifiedOperationalDTO[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardOpsActionRequest {
  entityId: string;
  type: "subscription" | "order";
  source?: "subscription" | "one_time_order";
  reason?: string;
  note?: string;
  payload?: {
    reason?: string;
    pickupCode?: string;
    notes?: string;
  };
}

export interface DashboardOpsActionResponse {
  status: boolean;
  data: UnifiedOperationalDTO;
}

// ── Filter types ──

export type DashboardOpsStatusFilter =
  | "all"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "canceled"
  | "confirmed"
  | "in_preparation"
  | "ready_for_pickup"
  | "fulfilled"
  | "expired"
  | "pending_payment";

// ── Status grouping helpers ──
// Centralised status-matching so every component uses the same logic.

const DELIVERED_STATUSES = ["delivered", "fulfilled"];
const CANCELED_STATUSES = ["canceled", "cancelled", "delivery_canceled"];
const PREPARING_STATUSES = ["preparing", "in_preparation"];

export function matchesStatusFilter(
  itemStatus: string,
  filter: DashboardOpsStatusFilter
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "preparing":
      return PREPARING_STATUSES.includes(itemStatus);
    case "out_for_delivery":
      return itemStatus === "out_for_delivery";
    case "delivered":
      return DELIVERED_STATUSES.includes(itemStatus);
    case "canceled":
      return CANCELED_STATUSES.includes(itemStatus);
    case "confirmed":
      return itemStatus === "confirmed";
    case "in_preparation":
      return itemStatus === "in_preparation";
    case "ready_for_pickup":
      return itemStatus === "ready_for_pickup";
    case "fulfilled":
      return itemStatus === "fulfilled";
    case "expired":
      return itemStatus === "expired";
    case "pending_payment":
      return itemStatus === "pending_payment";
    default:
      return false;
  }
}

export function countByFilter(
  items: UnifiedOperationalDTO[],
  filter: DashboardOpsStatusFilter
): number {
  if (filter === "all") return items.length;
  return items.filter((i) => matchesStatusFilter(i.status, filter)).length;
}

// ── Badge color helper ──

export type BadgeColorKey = "green" | "red" | "blue" | "orange" | "yellow";

const BADGE_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
};

const DEFAULT_BADGE =
  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";

export function getBadgeClasses(color: string): string {
  return BADGE_CLASSES[color] ?? DEFAULT_BADGE;
}
