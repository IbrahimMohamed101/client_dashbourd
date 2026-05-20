import api from "@/lib/apis";
import type {
  KitchenOperationsSummaryResponse,
  KitchenOperationsListResponse,
  KitchenOperationsTab,
  KitchenUiStatus,
  KitchenOperationsMode,
  BulkLockResponse,
  KitchenOperationsRow,
} from "@/types/kitchenTypes";
import { isOneTimeOrder } from "@/types/dashboardOpsTypes";
import { isUnsupportedOneTimeOrderAction } from "@/types/oneTimeOrderTypes";

// ----- New Operational Queue -----

export interface GetKitchenQueueParams {
  date: string;
  status?: string;
  method?: "all" | "pickup" | "delivery";
  q?: string;
  zoneId?: string;
  branchId?: string;
}

export const getKitchenQueue = async (params: GetKitchenQueueParams): Promise<KitchenOperationsRow[]> => {
  const { data } = await api.get("/api/dashboard/kitchen/queue", { params });
  return data.items || data;
};

// ----- Original Queries -----

export const fetchKitchenOperationsSummary = async (
  date: string,
  branchId?: string
): Promise<KitchenOperationsSummaryResponse> => {
  const params = new URLSearchParams({ date });
  if (branchId) params.append("branchId", branchId);
  const response = await api.get(
    `/api/kitchen/operations/summary?${params.toString()}`
  );
  return response.data;
};

export const fetchKitchenOperationsList = async ({
  date,
  tab,
  status,
  mode,
  search,
  page = 1,
  limit = 20,
  sortBy,
  sortOrder,
}: {
  date: string;
  tab?: KitchenOperationsTab;
  status?: KitchenUiStatus | "all";
  mode?: KitchenOperationsMode | "all";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}): Promise<KitchenOperationsListResponse> => {
  const params = new URLSearchParams({
    date,
    page: page.toString(),
    limit: limit.toString(),
  });

  if (tab) params.append("tab", tab);
  if (status && status !== "all") params.append("status", status);
  if (mode && mode !== "all") params.append("mode", mode);
  if (search) params.append("search", search);
  if (sortBy) params.append("sortBy", sortBy);
  if (sortOrder) params.append("sortOrder", sortOrder);

  const response = await api.get(
    `/api/kitchen/operations/list?${params.toString()}`
  );
  return response.data;
};

// ----- Overloaded Action Executor -----

export async function executeKitchenAction(
  endpoint: string,
  method?: string,
  body?: unknown
): Promise<unknown>;

export async function executeKitchenAction(args: {
  item: KitchenOperationsRow;
  action: string;
  reason?: string;
  notes?: string;
}): Promise<unknown>;

export async function executeKitchenAction(
  arg1: string | { item: KitchenOperationsRow; action: string; reason?: string; notes?: string },
  arg2?: string,
  arg3?: unknown
): Promise<unknown> {
  if (typeof arg1 === "string") {
    // Old signature: executeKitchenAction(endpoint, method, body)
    const endpoint = arg1;
    const method = arg2 || "POST";
    const body = arg3;
    const response =
      method === "POST"
        ? await api.post<unknown>(endpoint, body)
        : await api.put<unknown>(endpoint, body);
    return response.data;
  } else {
    // New signature: executeKitchenAction({ item, action, reason, notes })
    const { item, action, reason, notes } = arg1;
    if (isOneTimeOrder(item) && isUnsupportedOneTimeOrderAction(action)) {
      throw new Error(`الإجراء "${action}" غير مدعوم لطلبات الاستلام لمرة واحدة`);
    }

    if (isOneTimeOrder(item)) {
      const orderId = item.meta?.orderId || item.id;
      const { data } = await api.post<unknown>(`/api/dashboard/orders/${orderId}/actions/${action}`, { reason, notes });
      return data;
    } else {
      const { data } = await api.post<unknown>(`/api/dashboard/kitchen/actions/${action}`, {
        entityId: item.meta?.dayId || item.id,
        entityType: "subscription_day",
        payload: { reason, notes },
      });
      return data;
    }
  }
}

// ----- Unified Kitchen Board Actions -----

export interface KitchenActionPayload {
  entityId: string;
  entityType: "subscription_day" | "order";
  source?: "subscription" | "one_time_order";
  payload: {
    reason?: string;
    notes?: string;
    courierId?: string;
  };
}

export const executeKitchenBoardAction = async (
  action: string,
  body: KitchenActionPayload
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/actions/${action}`,
    body
  );
  return response.data;
};

// ----- Unified Pickup Board Actions -----

export interface PickupActionPayload {
  entityId: string;
  entityType: "subscription_day" | "order";
  source?: "subscription" | "one_time_order";
  payload: {
    reason?: string;
    notes?: string;
    pickupCode?: string;
  };
}

export const executePickupBoardAction = async (
  action: string,
  body: PickupActionPayload
) => {
  const response = await api.post(
    `/api/dashboard/pickup/actions/${action}`,
    body
  );
  return response.data;
};

// ----- Unified Courier Board Actions -----

export interface CourierActionPayload {
  entityId: string;
  entityType: "subscription_day" | "order";
  source?: "subscription" | "one_time_order";
  payload: {
    reason?: string;
    notes?: string;
    courierId?: string;
  };
}

export const executeCourierBoardAction = async (
  action: string,
  body: CourierActionPayload
) => {
  const response = await api.post(
    `/api/dashboard/courier/actions/${action}`,
    body
  );
  return response.data;
};

export const bulkLockDays = async (date: string): Promise<BulkLockResponse> => {
  const response = await api.post(`/api/dashboard/kitchen/days/${date}/lock`);
  return response.data;
};
