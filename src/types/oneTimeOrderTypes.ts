// ── One-Time Order Types ──
// One-Time Orders are SEPARATE from subscriptions.
// Do NOT use subscription endpoints, SubscriptionDay IDs, mealSlots, or remainingMeals.

// ── Order status lifecycle ──
// Normal pickup: confirmed -> in_preparation -> ready_for_pickup -> fulfilled
// Non-operational: pending_payment (visible but not actionable)
// Final: cancelled, expired

export type OneTimeOrderStatus =
  | "pending_payment"
  | "confirmed"
  | "in_preparation"
  | "ready_for_pickup"
  | "fulfilled"
  | "cancelled"
  | "expired";

export type OneTimeOrderPaymentStatus =
  | "initiated"
  | "paid"
  | "failed"
  | "refunded";

export type OneTimeOrderFulfillmentMethod = "pickup"; // pickup-only for launch

export type OneTimeOrderAction =
  | "prepare"
  | "ready_for_pickup"
  | "fulfill"
  | "cancel";

// ── Unsupported actions for pickup-only one-time orders ──
// Do NOT show: dispatch, notify_arrival, courier fulfill,
// delivery assignment, delivery zone, delivery address/window editing

export const UNSUPPORTED_ONE_TIME_ACTIONS = [
  "dispatch",
  "notify_arrival",
  "courier_fulfill",
  "delivery_assignment",
  "delivery_zone_assignment",
  "delivery_address_edit",
  "delivery_window_edit",
  "reopen",
] as const;

export type UnsupportedOneTimeAction =
  (typeof UNSUPPORTED_ONE_TIME_ACTIONS)[number];

/** Returns true if the given action is allowed for one-time pickup orders. */
export function isOneTimeOrderActionAllowed(action: string): boolean {
  return !(
    UNSUPPORTED_ONE_TIME_ACTIONS as readonly string[]
  ).includes(action);
}

// ── Final states ──
export const ONE_TIME_ORDER_FINAL_STATES: OneTimeOrderStatus[] = [
  "fulfilled",
  "cancelled",
  "expired",
];

export function isOneTimeOrderFinal(status: OneTimeOrderStatus): boolean {
  return ONE_TIME_ORDER_FINAL_STATES.includes(status);
}

// ── Customer ──
export interface OneTimeOrderCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// ── Order Item ──
export interface OneTimeOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

// ── Pricing (backend-calculated, frontend must NOT recalculate) ──
export interface OneTimeOrderPricing {
  subtotal?: number;
  discount?: number;
  vat?: number; // Already included – do NOT add again
  total?: number;
  currency?: string;
}

// ── Payment ──
export interface OneTimeOrderPayment {
  id: string;
  type: "one_time_order";
  status: OneTimeOrderPaymentStatus;
  method?: string;
  provider?: string;
  reference?: string;
  paidAt?: string;
}

// ── Pickup info ──
export interface OneTimeOrderPickup {
  branchId: string;
  branchName?: string;
  window?: string;
  pickupCode?: string;
}

// ── Activity log entry ──
export interface OneTimeOrderActivityEntry {
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy?: string;
  reason?: string;
  notes?: string;
  timestamp: string;
}

// ── Order List Item (from GET /api/dashboard/orders) ──
export interface OneTimeOrderListItem {
  source: "one_time_order";
  entityType: "order";
  entityId: string;
  orderNumber: string;
  status: OneTimeOrderStatus;
  paymentStatus: OneTimeOrderPaymentStatus;
  fulfillmentMethod: OneTimeOrderFulfillmentMethod;
  customer: OneTimeOrderCustomer;
  items: OneTimeOrderItem[];
  pricing: OneTimeOrderPricing;
  allowedActions: OneTimeOrderAction[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Order List Response ──
export interface OneTimeOrderListResponse {
  status: boolean;
  data: {
    items: OneTimeOrderListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// ── Order Detail (from GET /api/dashboard/orders/:orderId) ──
export interface OneTimeOrderDetail {
  source: "one_time_order";
  entityType: "order";
  entityId: string;
  orderNumber?: string;
  status: OneTimeOrderStatus;
  payment: OneTimeOrderPayment;
  activity: OneTimeOrderActivityEntry[];
  items: OneTimeOrderItem[];
  pricing?: OneTimeOrderPricing;
  pickup: OneTimeOrderPickup;
  customer?: OneTimeOrderCustomer;
  allowedActions: OneTimeOrderAction[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Order Detail Response ──
export interface OneTimeOrderDetailResponse {
  status: boolean;
  data: OneTimeOrderDetail;
}

// ── Action Request ──
export interface OneTimeOrderActionRequest {
  reason?: string;
  pickupCode?: string;
  notes?: string;
}

// ── Action Response ──
export interface OneTimeOrderActionResponse {
  status: boolean;
  data: {
    source: "one_time_order";
    entityType: "order";
    entityId: string;
    status: OneTimeOrderStatus;
    allowedActions: OneTimeOrderAction[];
  };
}

// ── Kitchen Queue Item (from GET /api/dashboard/kitchen/queue) ──
export interface KitchenQueueOneTimeOrder {
  source: "one_time_order";
  entityType: "order";
  entityId: string;
  orderNumber?: string;
  status: OneTimeOrderStatus;
  fulfillmentMethod: "pickup";
  customer?: OneTimeOrderCustomer;
  items?: OneTimeOrderItem[];
  pickup?: OneTimeOrderPickup;
  allowedActions: OneTimeOrderAction[];
  paymentStatus?: OneTimeOrderPaymentStatus;
}

// ── Pickup Queue Item (from GET /api/dashboard/pickup/queue) ──
export interface PickupQueueOneTimeOrder {
  source: "one_time_order";
  entityType: "order";
  entityId: string;
  orderNumber?: string;
  status: "ready_for_pickup";
  fulfillmentMethod: "pickup";
  customer?: OneTimeOrderCustomer;
  items?: OneTimeOrderItem[];
  pickup?: OneTimeOrderPickup;
  allowedActions: OneTimeOrderAction[];
}

// ── Unified Ops Action Request ──
export interface UnifiedOpsActionRequest {
  entityId: string;
  entityType: "order";
  source: "one_time_order";
  payload: {
    reason?: string;
    pickupCode?: string;
    notes?: string;
  };
}

// ── Error codes ──
export type OneTimeOrderErrorCode =
  | "INVALID_TRANSITION"
  | "ORDER_NOT_FOUND"
  | "FORBIDDEN"
  | "REOPEN_NOT_SUPPORTED"
  | "ACTION_NOT_ALLOWED"
  | "PAYMENT_NOT_PAID"
  | "ORDER_FINAL"
  | "INVALID_OBJECT_ID"
  | "ONE_TIME_ORDER_DELIVERY_DISABLED";

export interface OneTimeOrderError {
  status: false;
  code: OneTimeOrderErrorCode;
  message: string;
}

// ── List query params ──
export interface OneTimeOrderListParams {
  status?: OneTimeOrderStatus;
  paymentStatus?: OneTimeOrderPaymentStatus;
  fulfillmentMethod?: "pickup";
  date?: string;
  from?: string;
  to?: string;
  branchId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

// ── Status label helper (Arabic) ──
export function getOneTimeOrderStatusLabel(status: OneTimeOrderStatus): string {
  const labels: Record<OneTimeOrderStatus, string> = {
    pending_payment: "بانتظار الدفع",
    confirmed: "مؤكد",
    in_preparation: "قيد التحضير",
    ready_for_pickup: "جاهز للاستلام",
    fulfilled: "تم الاستلام",
    cancelled: "ملغي",
    expired: "منتهي الصلاحية",
  };
  return labels[status] ?? status;
}

// ── Status color helper ──
export function getOneTimeOrderStatusColor(status: OneTimeOrderStatus): {
  bg: string;
  text: string;
  dot: string;
  border: string;
} {
  const config: Record<
    OneTimeOrderStatus,
    { bg: string; text: string; dot: string; border: string }
  > = {
    pending_payment: {
      bg: "bg-gray-500/10",
      text: "text-gray-600 dark:text-gray-400",
      dot: "bg-gray-500 dark:bg-gray-400",
      border: "border-gray-500/20",
    },
    confirmed: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500 dark:bg-blue-400",
      border: "border-blue-500/20",
    },
    in_preparation: {
      bg: "bg-amber-500/10",
      text: "text-amber-500 dark:text-amber-400",
      dot: "bg-amber-500 dark:bg-amber-400",
      border: "border-amber-500/20",
    },
    ready_for_pickup: {
      bg: "bg-teal-500/10",
      text: "text-teal-600 dark:text-teal-400",
      dot: "bg-teal-500 dark:bg-teal-400",
      border: "border-teal-500/20",
    },
    fulfilled: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500 dark:bg-emerald-400",
      border: "border-emerald-500/20",
    },
    cancelled: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      dot: "bg-red-500 dark:bg-red-400",
      border: "border-red-500/20",
    },
    expired: {
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
      dot: "bg-orange-500 dark:bg-orange-400",
      border: "border-orange-500/20",
    },
  };
  return config[status] ?? config.confirmed;
}
