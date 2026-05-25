export type OneTimeOrderStatus =
  | "pending_payment"
  | "confirmed"
  | "in_preparation"
  | "ready_for_pickup"
  | "fulfilled"
  | "cancelled"
  | "expired"
  | string;

export type OneTimeOrderAction =
  | "prepare"
  | "ready_for_pickup"
  | "fulfill"
  | "cancel"
  | string;

export type OneTimeOrderPaymentStatus =
  | "initiated"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"
  | "expired"
  | string;

export type OneTimeOrderFulfillmentMethod = "pickup" | "delivery" | string;

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

export function isUnsupportedOneTimeOrderAction(action: string): boolean {
  return (UNSUPPORTED_ONE_TIME_ACTIONS as readonly string[]).includes(action);
}

export function isOneTimeOrderActionAllowed(action: string): boolean {
  return !isUnsupportedOneTimeOrderAction(action);
}

// ── Final states ──
export const ONE_TIME_ORDER_FINAL_STATES: OneTimeOrderStatus[] = [
  "fulfilled",
  "cancelled",
  "expired",
];

export function isOneTimeOrderFinal(status: OneTimeOrderStatus): boolean {
  return ONE_TIME_ORDER_FINAL_STATES.includes(status) || status === "fulfilled" || status === "cancelled" || status === "expired";
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

// ── Pricing ──
export interface OneTimeOrderPricing {
  subtotal?: number;
  discount?: number;
  vat?: number;
  total?: number;
  currency?: string;
}

export interface OneTimeOrderListPricing {
  totalHalala: number;
  currency: string;
  vatIncluded: boolean;
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

// ── Order List Item ──
export interface OneTimeOrderListItem {
  source: "one_time_order";
  entityType: "order";
  entityId: string;
  orderId: string;
  orderNumber: string;
  status: OneTimeOrderStatus;
  paymentStatus: OneTimeOrderPaymentStatus;
  fulfillmentMethod: OneTimeOrderFulfillmentMethod;
  customer: OneTimeOrderCustomer;
  items: OneTimeOrderItem[];
  pricing: OneTimeOrderListPricing;
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

// ── Order Detail ──
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

// ── Kitchen Queue Item ──
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

// ── Pickup Queue Item ──
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
  | "FINAL_STATUS"
  | "INVALID_OBJECT_ID"
  | "INVALID_ORDER_ID"
  | "DELIVERY_NOT_SUPPORTED"
  | "ONE_TIME_ORDER_DELIVERY_DISABLED";

export interface OneTimeOrderError {
  status: false;
  code: OneTimeOrderErrorCode;
  message: string;
}

// ── List query params ──
export interface OneTimeOrderListParams {
  status?: string;
  paymentStatus?: OneTimeOrderPaymentStatus;
  fulfillmentMethod?: "pickup";
  date?: string;
  from?: string;
  to?: string;
  branchId?: string;
  zoneId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

// ── Status label helper (Arabic) ──
export function getOneTimeOrderStatusLabel(status: OneTimeOrderStatus | string): string {
  switch (status) {
    case "pending_payment": return "بانتظار الدفع";
    case "confirmed": return "مؤكد";
    case "in_preparation": return "قيد التحضير";
    case "ready_for_pickup": return "جاهز للاستلام";
    case "fulfilled": return "تم الاستلام";
    case "cancelled": return "ملغي";
    case "expired": return "منتهي الصلاحية";
    default: return status;
  }
}

// ── Status color helper ──
export function getOneTimeOrderStatusColor(status: OneTimeOrderStatus | string): {
  bg: string;
  text: string;
  dot: string;
  border: string;
} {
  switch (status) {
    case "pending_payment":
      return { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/20", dot: "bg-yellow-500" };
    case "confirmed":
      return { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", dot: "bg-blue-500" };
    case "in_preparation":
      return { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20", dot: "bg-orange-500" };
    case "ready_for_pickup":
      return { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-500/20", dot: "bg-teal-500" };
    case "fulfilled":
      return { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", dot: "bg-emerald-500" };
    case "cancelled":
      return { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20", dot: "bg-red-500" };
    case "expired":
      return { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-500/20", dot: "bg-gray-500" };
    default:
      return { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-500/20", dot: "bg-gray-500" };
  }
}
