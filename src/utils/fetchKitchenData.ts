/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/apis";
import type {
  KitchenOperationsSummaryResponse,
  KitchenOperationsListResponse,
  KitchenOperationsTab,
  KitchenUiStatus,
  KitchenOperationsMode,
  BulkLockResponse,
} from "@/types/kitchenTypes";

// ----- Queries -----

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

// ----- Generic action executor (uses the endpoint from the row action) -----
export const executeKitchenAction = async (
  endpoint: string,
  method: string = "POST",
  body?: any
) => {
  const response =
    method === "POST"
      ? await api.post(endpoint, body)
      : await api.put(endpoint, body);
  return response.data;
};

// ----- Unified Kitchen Board Actions -----
// POST /api/dashboard/kitchen/actions/:action
// Body: { entityId, entityType: "subscription_day", payload: { reason, notes } }

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
// POST /api/dashboard/pickup/actions/:action
// Body: { entityId, entityType: "subscription_day" | "order", payload: { reason, notes } }

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
// POST /api/dashboard/courier/actions/:action
// Body: { entityId, entityType: "subscription_day", payload: { reason, notes, courierId? } }

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
