import api from "@/lib/apis";
import { extractOperationsQueueItems } from "@/lib/operationsBoard";
import { type UnifiedQueueItem, isOneTimeOrder } from "@/types/dashboardOpsTypes";
import type {
  DashboardOpsListResponse,
  DashboardOpsActionResponse,
  DashboardOpsActionRequest,
} from "@/types/dashboardOpsTypes";
import { isOneTimeOrderActionAllowed } from "@/types/oneTimeOrderTypes";

export interface QueueParams {
  status?: string | string[];
  method?: string;
  q?: string;
  zoneId?: string;
  branchId?: string;
  includeCanceled?: boolean;
}

export interface ManualDeductionHistoryItem {
  id: string;
  businessDate?: string | null;
  deducted?: {
    regularMeals?: number | null;
    premiumMeals?: number | null;
    total?: number | null;
  };
  before?: {
    remainingRegularMeals?: number | null;
    remainingPremiumMeals?: number | null;
    remainingMeals?: number | null;
  };
  after?: {
    remainingRegularMeals?: number | null;
    remainingPremiumMeals?: number | null;
    remainingMeals?: number | null;
  };
  fulfillmentMethod?: string | null;
  actor?: {
    id?: string | null;
    role?: string | null;
  };
  reason?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export interface ManualDeductionHistory {
  contractVersion: "dashboard_manual_deductions.v1";
  subscriptionId: string;
  count: number;
  items: ManualDeductionHistoryItem[];
}

export interface GetPickupQueueParams {
  date: string;
}

function queueRequestParams(date: string, params: QueueParams = {}) {
  return {
    ...params,
    date,
    status: Array.isArray(params.status) ? params.status.join(",") : params.status,
  };
}

export const getKitchenQueue = async (
  date: string,
  params: QueueParams = {}
): Promise<UnifiedQueueItem[]> => {
  const { data } = await api.get("/api/dashboard/kitchen/queue", {
    params: queueRequestParams(date, params),
  });
  return extractOperationsQueueItems(data);
};

export const getPickupQueue = async (
  dateOrParams: string | GetPickupQueueParams,
  params: QueueParams = {}
): Promise<UnifiedQueueItem[]> => {
  const date =
    typeof dateOrParams === "string" ? dateOrParams : dateOrParams.date;
  const { data } = await api.get("/api/dashboard/pickup/queue", {
    params: queueRequestParams(date, params),
  });
  return extractOperationsQueueItems(data);
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

export const getCourierQueue = async (
  dateOrParams: string | GetCourierQueueParams,
  params: QueueParams = {}
): Promise<UnifiedQueueItem[]> => {
  const date =
    typeof dateOrParams === "string" ? dateOrParams : dateOrParams.date;
  const mergedParams =
    typeof dateOrParams === "string" ? params : { ...dateOrParams, ...params };
  const { data } = await api.get("/api/dashboard/courier/queue", {
    params: queueRequestParams(date, mergedParams),
  });
  return extractOperationsQueueItems(data);
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

export const fetchManualDeductionHistory = async (
  subscriptionId: string,
  limit = 5
): Promise<ManualDeductionHistory> => {
  const { data } = await api.get(
    `/api/dashboard/subscriptions/${subscriptionId}/manual-deductions`,
    { params: { limit } }
  );
  return data?.data || data;
};

// ── Fetch all ops for a date ──
export const fetchDashboardOpsList = async (
  date: string
): Promise<DashboardOpsListResponse> => {
  const response = await api.get("/api/dashboard/ops/list", {
    params: { date },
  });
  const items = extractOperationsQueueItems(response.data);
  return {
    ...response.data,
    data: {
      ...response.data?.data,
      date: response.data?.data?.date ?? date,
      items,
    },
  };
};

// ── Full-text search across ops ──
export const fetchDashboardOpsSearch = async (
  query: string
): Promise<DashboardOpsListResponse> => {
  const response = await api.get("/api/dashboard/ops/search", {
    params: { q: query },
  });
  const items = extractOperationsQueueItems(response.data);
  return {
    ...response.data,
    data: {
      ...response.data?.data,
      date: response.data?.data?.date ?? "",
      items,
    },
  };
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
