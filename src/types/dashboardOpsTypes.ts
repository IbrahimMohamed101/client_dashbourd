export interface UnifiedQueueItem {
  // ── Identity ──
  id: string;
  entityId: string;
  entityType: "subscription_day" | "order" | "subscription_pickup_request";
  source: "subscription" | "one_time_order" | "subscription_pickup_request";
  type: "subscription" | "order" | "subscription_pickup_request";

  // ── Display ──
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  statusLabel: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };

  // ── Customer ──
  customer: {
    id: string;
    name: string;
    phone: string;
  };

  // ── Context ──
  context: {
    date: string | null;
    window?: string;
    address?: unknown;
    addressSummary?: string | null;
    branch?: string | null;
    pickupCode?: string | null;
    notes?: string | null;
    mealCount?: number;
    requiredMealCount?: number;
  };

  // ── Delivery / Pickup details ──
  delivery?: {
    method?: string;
    address?: unknown;
    zone?: { id: string; name: string } | null;
    zoneId?: string | null;
    deliveryWindow?: string;
    pickupLocationId?: string | null;
  };
  pickup?: {
    pickupLocationId?: string | null;
    pickupRequested?: boolean;
    pickupPreparedAt?: string | null;
    pickupCodeIssuedAt?: string | null;
    pickupVerifiedAt?: string | null;
    pickupNoShowAt?: string | null;
    pickupCode?: string | null;
  };

  // ── Items (orders) ──
  items?: { id: string; name: string; quantity: number; notes?: string }[];
  pricing?: unknown;
  paymentStatus?: string | null;
  orderNumber?: string | null;

  // ── Subscription-specific ──
  mealSlots?: { slot: string; items: { name: string; quantity: number; notes?: string }[] }[];
  materializedMeals?: unknown[];
  addonSelections?: unknown[];
  premiumUpgradeSelections?: unknown[];
  subscriptionDayId?: string | null;
  subscriptionId?: string | null;

  // ── Actions ──
  allowedActions: {
    id: string;
    label: string;
    color: string;
    icon: string;
    requiresReason: boolean;
  }[];

  // ── Metadata ──
  notes?: string | null;
  timestamps: {
    createdAt: string | null;
    updatedAt: string | null;
  };
}

export interface UnifiedOperationalDTO {
  id: string;
  type: "subscription" | "order" | "subscription_pickup_request";
  source?: "subscription" | "one_time_order" | "subscription_pickup_request";
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };
  customer: { name: string; phone: string };
  context: {
    date: string | null;
    window?: string;
    addressSummary?: string | null;
    pickupCode?: string | null;
    notes?: string | null;
    cancelInfo?: { reason: string; note?: string };
    orderDetails?: string;
  };
  allowedActions: {
    id: string;
    label: string;
    color: string;
    icon: string;
    requiresReason: boolean;
  }[];
  timestamps: { createdAt: string | null; updatedAt: string | null };
}

export const isOneTimeOrder = (item: { source?: string; entityType?: string }): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};

export const isSubscriptionDay = (item: { source?: string; entityType?: string }): boolean => {
  return item.entityType === "subscription_day" || item.source === "subscription";
};

export const isPickupRequest = (item: { source?: string; entityType?: string }): boolean => {
  return item.entityType === "subscription_pickup_request" || item.source === "subscription_pickup_request";
};

// ── API response wrappers ──

export interface DashboardOpsListResponse {
  status: boolean;
  data: {
    date: string;
    items: UnifiedQueueItem[];
    filters: {
      status: string[];
      method: string;
      q: string | null;
      zoneId: string | null;
      branchId: string | null;
    };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardOpsActionRequest {
  entityId: string;
  entityType: string;
  source?: string;
  action: string;
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
  data: UnifiedQueueItem;
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
  items: { status: string }[],
  filter: DashboardOpsStatusFilter
): number {
  if (filter === "all") return items.length;
  return items.filter((i) => matchesStatusFilter(i.status, filter)).length;
}

// ── Badge color helper ──

export type BadgeColorKey = "green" | "red" | "blue" | "orange" | "yellow";

export const BADGE_CLASSES: Record<BadgeColorKey, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
};

export function getBadgeClasses(color: string): string {
  return BADGE_CLASSES[color as BadgeColorKey] || BADGE_CLASSES.blue;
}
