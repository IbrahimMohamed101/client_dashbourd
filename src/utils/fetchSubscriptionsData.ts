import api from "@/lib/apis";

export const fetchSubscriptionsSummary = async () => {
  try {
    const response = await api.get("/api/dashboard/subscriptions/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscriptions summary:", error);
    throw error;
  }
};

export const fetchSubscriptionsList = async ({
  status,
  page = 1,
  limit = 20,
  q = "",
}: {
  status?: string | null;
  page?: number;
  limit?: number;
  q?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (q) params.append("q", q);

    const response = await api.get(
      `/api/dashboard/subscriptions?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching subscriptions list:", error);
    throw error;
  }
};

export const fetchSubscriptionDetails = async (id: string) => {
  const response = await api.get(`/api/dashboard/subscriptions/${id}`);
  return response.data;
};

export const freezeSubscription = async ({
  id,
  data,
}: {
  id: string;
  data: { startDate: string; days: number };
}) => {
  console.log(data);

  const response = await api.post(
    `/api/dashboard/subscriptions/${id}/freeze`,
    data
  );
  return response.data;
};

export const unfreezeSubscription = async (id: string) => {
  const response = await api.post(
    `/api/dashboard/subscriptions/${id}/unfreeze`
  );
  return response.data;
};

export const extendSubscription = async ({
  id,
  data,
}: {
  id: string;
  data: { days: number };
}) => {
  const response = await api.post(
    `/api/dashboard/subscriptions/${id}/extend`,
    data
  );
  return response.data;
};

export const cancelSubscription = async (id: string) => {
  const response = await api.post(`/api/dashboard/subscriptions/${id}/cancel`);
  return response.data;
};

export const createSubscription = async (data: Record<string, unknown>) => {
  const response = await api.post("/api/dashboard/subscriptions", data);
  return response.data;
};

// ----- Quote endpoint -----
export const fetchSubscriptionQuote = async (data: Record<string, unknown>) => {
  const response = await api.post("/api/dashboard/subscriptions/quote", data);
  return response.data;
};

// ----- Skip/Unskip days -----
export const skipSubscriptionDay = async (subscriptionId: string, date: string) => {
  const response = await api.post(`/api/dashboard/subscriptions/${subscriptionId}/days/${date}/skip`);
  return response.data;
};

export const unskipSubscriptionDay = async (subscriptionId: string, date: string) => {
  const response = await api.post(`/api/dashboard/subscriptions/${subscriptionId}/days/${date}/unskip`);
  return response.data;
};

// ----- Audit log -----
export const fetchSubscriptionAuditLog = async (subscriptionId: string) => {
  const response = await api.get(`/api/dashboard/subscriptions/${subscriptionId}/audit-log`);
  return response.data;
};

// ----- Delivery -----
export const fetchSubscriptionDelivery = async (subscriptionId: string, date: string) => {
  const response = await api.get(`/api/dashboard/subscriptions/${subscriptionId}/delivery?date=${date}`);
  return response.data;
};

export const updateSubscriptionDelivery = async (subscriptionId: string, date: string, data: Record<string, unknown>) => {
  const response = await api.patch(`/api/dashboard/subscriptions/${subscriptionId}/delivery?date=${date}`, data);
  return response.data;
};

// ----- Balances -----
export const fetchSubscriptionBalances = async (subscriptionId: string) => {
  const response = await api.get(`/api/dashboard/subscriptions/${subscriptionId}/balances`);
  return response.data;
};

// ----- Addon entitlements -----
export const fetchSubscriptionAddonEntitlements = async (subscriptionId: string) => {
  const response = await api.get(`/api/dashboard/subscriptions/${subscriptionId}/addon-entitlements`);
  return response.data;
};

export const createSubscriptionAddonEntitlement = async (subscriptionId: string, data: Record<string, unknown>) => {
  const response = await api.post(`/api/dashboard/subscriptions/${subscriptionId}/addon-entitlements`, data);
  return response.data;
};

export const deleteSubscriptionAddonEntitlement = async (subscriptionId: string, entitlementId: string) => {
  const response = await api.delete(`/api/dashboard/subscriptions/${subscriptionId}/addon-entitlements/${entitlementId}`);
  return response.data;
};
