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
    `/api/dashboard/kitchen/operations/summary?${params.toString()}`
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
    `/api/dashboard/kitchen/operations/list?${params.toString()}`
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

// ----- Subscriptions Transitions -----

export const lockSubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/lock`
  );
  return response.data;
};

export const reopenSubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/reopen`
  );
  return response.data;
};

export const inPreparationSubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/in-preparation`
  );
  return response.data;
};

export const outForDeliverySubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/out-for-delivery`
  );
  return response.data;
};

export const readyForPickupSubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/ready-for-pickup`
  );
  return response.data;
};

export const fulfillPickupSubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/fulfill-pickup`
  );
  return response.data;
};

export const cancelAtBranchSubscriptionDay = async (
  subscriptionId: string,
  date: string
) => {
  const response = await api.post(
    `/api/dashboard/kitchen/subscriptions/${subscriptionId}/days/${date}/cancel-at-branch`
  );
  return response.data;
};

export const bulkLockDays = async (date: string): Promise<BulkLockResponse> => {
  const response = await api.post(`/api/dashboard/kitchen/days/${date}/lock`);
  return response.data;
};

// ----- Orders Transitions -----

export const prepareOrder = async (id: string) => {
  const response = await api.post(`/api/dashboard/kitchen/orders/${id}/preparing`);
  return response.data;
};

export const outForDeliveryOrder = async (id: string) => {
  const response = await api.post(`/api/dashboard/kitchen/orders/${id}/out-for-delivery`);
  return response.data;
};

export const readyForPickupOrder = async (id: string) => {
  const response = await api.post(`/api/dashboard/kitchen/orders/${id}/ready-for-pickup`);
  return response.data;
};

export const fulfillOrder = async (id: string) => {
  const response = await api.post(`/api/dashboard/kitchen/orders/${id}/fulfilled`);
  return response.data;
};

// ----- Pickups Transitions -----

export const verifyPickup = async (dayId: string) => {
  const response = await api.post(`/api/dashboard/kitchen/pickups/${dayId}/verify`);
  return response.data;
};

export const noShowPickup = async (dayId: string) => {
  const response = await api.post(`/api/dashboard/kitchen/pickups/${dayId}/no-show`);
  return response.data;
};
