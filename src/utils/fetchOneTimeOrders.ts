import api from "@/lib/apis";
import type {
  OneTimeOrderListParams,
  OneTimeOrderListResponse,
  OneTimeOrderDetailResponse,
  OneTimeOrderActionRequest,
  OneTimeOrderActionResponse,
  KitchenQueueOneTimeOrder,
  PickupQueueOneTimeOrder,
  UnifiedOpsActionRequest,
  OneTimeOrderError,
} from "@/types/oneTimeOrderTypes";
import { isOneTimeOrderActionAllowed } from "@/types/oneTimeOrderTypes";

// ── Step 1: List dashboard orders ──
// GET /api/dashboard/orders
// One-Time Orders are separate from subscriptions. Do NOT use subscription endpoints.

export const fetchOneTimeOrders = async (
  params: OneTimeOrderListParams = {}
): Promise<OneTimeOrderListResponse> => {
  const searchParams = new URLSearchParams();

  // Always filter by pickup for launch (pickup-only)
  searchParams.append(
    "fulfillmentMethod",
    params.fulfillmentMethod ?? "pickup"
  );

  if (params.status) searchParams.append("status", params.status);
  if (params.paymentStatus)
    searchParams.append("paymentStatus", params.paymentStatus);
  if (params.date) searchParams.append("date", params.date);
  if (params.from) searchParams.append("from", params.from);
  if (params.to) searchParams.append("to", params.to);
  if (params.branchId) searchParams.append("branchId", params.branchId);
  if (params.q) searchParams.append("q", params.q);
  searchParams.append("page", (params.page ?? 1).toString());
  searchParams.append("limit", (params.limit ?? 20).toString());

  const response = await api.get(
    `/api/dashboard/orders?${searchParams.toString()}`
  );
  return response.data;
};

// ── Step 2: View order detail ──
// GET /api/dashboard/orders/:orderId

export const fetchOneTimeOrderDetail = async (
  orderId: string
): Promise<OneTimeOrderDetailResponse> => {
  const response = await api.get(`/api/dashboard/orders/${orderId}`);
  return response.data;
};

// ── Step 3: Action – Prepare ──
// POST /api/dashboard/orders/:orderId/actions/prepare
// Allowed from: confirmed → in_preparation

export const prepareOneTimeOrder = async (
  orderId: string,
  body: OneTimeOrderActionRequest = {}
): Promise<OneTimeOrderActionResponse> => {
  const response = await api.post(
    `/api/dashboard/orders/${orderId}/actions/prepare`,
    {
      reason:
        body.reason ?? "Kitchen started preparing the one-time pickup order",
      notes: body.notes,
    }
  );
  return response.data;
};

// ── Step 4: Action – Ready for Pickup ──
// POST /api/dashboard/orders/:orderId/actions/ready_for_pickup
// Allowed from: in_preparation → ready_for_pickup

export const readyForPickupOneTimeOrder = async (
  orderId: string,
  body: OneTimeOrderActionRequest = {}
): Promise<OneTimeOrderActionResponse> => {
  const response = await api.post(
    `/api/dashboard/orders/${orderId}/actions/ready_for_pickup`,
    {
      reason: body.reason ?? "Order is ready for pickup",
      pickupCode: body.pickupCode,
      notes: body.notes,
    }
  );
  return response.data;
};

// ── Step 5: Action – Fulfill ──
// POST /api/dashboard/orders/:orderId/actions/fulfill
// Allowed from: ready_for_pickup → fulfilled

export const fulfillOneTimeOrder = async (
  orderId: string,
  body: OneTimeOrderActionRequest = {}
): Promise<OneTimeOrderActionResponse> => {
  const response = await api.post(
    `/api/dashboard/orders/${orderId}/actions/fulfill`,
    {
      reason: body.reason ?? "Customer picked up the order from branch",
      pickupCode: body.pickupCode,
      notes: body.notes,
    }
  );
  return response.data;
};

// ── Step 6: Action – Cancel ──
// POST /api/dashboard/orders/:orderId/actions/cancel
// Allowed from: confirmed, in_preparation, ready_for_pickup → cancelled
// Cancel does NOT automatically mean refund.

export const cancelOneTimeOrder = async (
  orderId: string,
  body: OneTimeOrderActionRequest = {}
): Promise<OneTimeOrderActionResponse> => {
  const response = await api.post(
    `/api/dashboard/orders/${orderId}/actions/cancel`,
    {
      reason: body.reason ?? "Customer requested cancellation",
      notes: body.notes,
    }
  );
  return response.data;
};

// ── Generic action dispatcher ──
// Routes to the correct action function based on action name

export const executeOneTimeOrderAction = async (
  orderId: string,
  action: string,
  body: OneTimeOrderActionRequest = {}
): Promise<OneTimeOrderActionResponse> => {
  // Block unsupported actions for pickup-only one-time orders
  if (!isOneTimeOrderActionAllowed(action)) {
    return Promise.reject({
      status: false,
      code: "ACTION_NOT_ALLOWED",
      message: `Action "${action}" is not supported for pickup-only one-time orders`,
    } as OneTimeOrderError);
  }

  switch (action) {
    case "prepare":
      return prepareOneTimeOrder(orderId, body);
    case "ready_for_pickup":
      return readyForPickupOneTimeOrder(orderId, body);
    case "fulfill":
      return fulfillOneTimeOrder(orderId, body);
    case "cancel":
      return cancelOneTimeOrder(orderId, body);
    default:
      return Promise.reject({
        status: false,
        code: "ACTION_NOT_ALLOWED",
        message: `Unknown action "${action}"`,
      } as OneTimeOrderError);
  }
};

// ── Kitchen Queue ──
// GET /api/dashboard/kitchen/queue
// One-time orders appear with source=one_time_order, entityType=order

export const fetchKitchenQueue = async (
  params: {
    date?: string;
    status?: string;
    method?: string;
    q?: string;
    zoneId?: string;
    branchId?: string;
  } = {}
): Promise<{
  status: boolean;
  data: { items: KitchenQueueOneTimeOrder[] };
}> => {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.append("date", params.date);
  if (params.status) searchParams.append("status", params.status);
  if (params.method) searchParams.append("method", params.method);
  if (params.q) searchParams.append("q", params.q);
  if (params.zoneId) searchParams.append("zoneId", params.zoneId);
  if (params.branchId) searchParams.append("branchId", params.branchId);

  const response = await api.get(
    `/api/dashboard/kitchen/queue?${searchParams.toString()}`
  );
  return response.data;
};

// ── Pickup Queue ──
// GET /api/dashboard/pickup/queue
// Shows orders that are ready_for_pickup

export const fetchPickupQueue = async (
  params: {
    date?: string;
    status?: string;
    method?: string;
    q?: string;
    branchId?: string;
  } = {}
): Promise<{ status: boolean; data: { items: PickupQueueOneTimeOrder[] } }> => {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.append("date", params.date);
  if (params.status) searchParams.append("status", params.status);
  else
    searchParams.append(
      "status",
      "in_preparation,ready_for_pickup,fulfilled,canceled_at_branch,no_show"
    );
  if (params.method) searchParams.append("method", params.method);
  else searchParams.append("method", "pickup");
  if (params.q) searchParams.append("q", params.q);
  if (params.branchId) searchParams.append("branchId", params.branchId);

  const response = await api.get(
    `/api/dashboard/pickup/queue?${searchParams.toString()}`
  );
  return response.data;
};

// ── Unified Ops Action ──
// POST /api/dashboard/ops/actions/:action
// Always include entityType=order and source=one_time_order

export const executeUnifiedOpsAction = async (
  action: string,
  payload: UnifiedOpsActionRequest
): Promise<OneTimeOrderActionResponse> => {
  // Block unsupported actions
  if (!isOneTimeOrderActionAllowed(action)) {
    return Promise.reject({
      status: false,
      code: "ACTION_NOT_ALLOWED",
      message: `Action "${action}" is not supported for pickup-only one-time orders`,
    } as OneTimeOrderError);
  }

  const response = await api.post(
    `/api/dashboard/ops/actions/${action}`,
    payload
  );
  return response.data;
};
