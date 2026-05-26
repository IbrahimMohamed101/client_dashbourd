import api from "@/lib/apis";
import { type UnifiedQueueItem, isOneTimeOrder } from "@/types/dashboardOpsTypes";
import type {
  DashboardOpsListResponse,
  DashboardOpsActionResponse,
  DashboardOpsActionRequest,
} from "@/types/dashboardOpsTypes";
import { isOneTimeOrderActionAllowed } from "@/types/oneTimeOrderTypes";

export interface GetPickupQueueParams {
  date: string;
}

export const getPickupQueue = async (params: GetPickupQueueParams): Promise<UnifiedQueueItem[]> => {
  const { data } = await api.get("/api/dashboard/pickup/queue", { params });
  return data.items || data;
};

export const executePickupAction = async ({
  item,
  action,
  reason,
  notes,
  pickupCode,
}: {
  item: UnifiedQueueItem;
  action: string;
  reason?: string;
  notes?: string;
  pickupCode?: string;
}) => {
  if (isOneTimeOrder(item)) {
    const orderId = item.entityId || item.id;
    const body: Record<string, string> = {};
    if (reason) body.reason = reason;
    if (notes) body.notes = notes;
    if (pickupCode) body.pickupCode = pickupCode;

    const { data } = await api.post(`/api/dashboard/orders/${orderId}/actions/${action}`, body);
    return data;
  } else {
    const { data } = await api.post(`/api/dashboard/pickup/actions/${action}`, {
      entityId: item.subscriptionDayId || item.id,
      entityType: "subscription_day",
      payload: { reason, notes, ...(pickupCode ? { pickupCode } : {}) },
    });
    return data;
  }
};

export interface GetCourierQueueParams {
  date: string;
  status?: string;
  method: "delivery";
}

export const getCourierQueue = async (params: GetCourierQueueParams): Promise<UnifiedQueueItem[]> => {
  const { data } = await api.get("/api/dashboard/courier/queue", { params });
  return data.items || data;
};

export const executeCourierAction = async ({
  item,
  action,
  reason,
  notes,
  courierId,
}: {
  item: UnifiedQueueItem;
  action: string;
  reason?: string;
  notes?: string;
  courierId?: string;
}) => {
  const { data } = await api.post(`/api/dashboard/courier/actions/${action}`, {
    entityId: item.subscriptionDayId || item.id,
    entityType: "subscription_day",
    payload: { reason, notes, ...(courierId ? { courierId } : {}) },
  });
  return data;
};

export const searchSubscription = async (phone: string) => {
  const { data } = await api.get(`/api/dashboard/subscriptions/search?phone=${encodeURIComponent(phone)}`);
  return data.items || data;
};

export const executeManualDeduction = async ({
  id,
  regularMeals,
  premiumMeals,
  reason,
  notes,
}: {
  id: string;
  regularMeals: number;
  premiumMeals: number;
  reason: string;
  notes: string;
}) => {
  const { data } = await api.post(`/api/dashboard/subscriptions/${id}/manual-deduction`, {
    regularMeals,
    premiumMeals,
    reason,
    notes,
  });
  return data;
};

// ── Fetch all ops for a date ──
export const fetchDashboardOpsList = async (
  date: string
): Promise<DashboardOpsListResponse> => {
  const response = await api.get("/api/dashboard/ops/list", {
    params: { date },
  });
  return response.data;
};

// ── Full-text search across ops ──
export const fetchDashboardOpsSearch = async (
  query: string
): Promise<DashboardOpsListResponse> => {
  const response = await api.get("/api/dashboard/ops/search", {
    params: { q: query },
  });
  return response.data;
};

export const fetchDeliverySchedule = async (
  date?: string
): Promise<unknown> => {
  const response = await api.get("/api/dashboard/delivery-schedule", {
    params: {
      ...(date ? { date } : {}),
    },
  });
  return response.data;
};

// ── Execute an action ──
export const executeDashboardOpsAction = async (
  action: string,
  payload: DashboardOpsActionRequest
): Promise<DashboardOpsActionResponse> => {
  if (
    payload.source === "one_time_order" &&
    !isOneTimeOrderActionAllowed(action)
  ) {
    return Promise.reject({
      ok: false,
      code: "ACTION_NOT_ALLOWED",
      message: `Action "${action}" is not supported for pickup-only one-time orders`,
    });
  }

  const response = await api.post(
    `/api/dashboard/ops/actions/${action}`,
    payload
  );
  return response.data;
};
