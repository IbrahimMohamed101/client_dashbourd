import api from "@/lib/apis";
import type {
  SubscriptionAddonEntitlementPayload,
  SubscriptionDeliveryUpdatePayload,
  ExtendSubscriptionPayload,
} from "@/types/subscriptionTypes";
import {
  subscriptionAddonEntitlementsUrl,
  subscriptionBalancesUrl,
  subscriptionDeliveryUrl,
  subscriptionExtendUrl,
} from "./subscriptionApiContract";

type ApiStatusError = {
  response?: {
    status?: number;
  };
};

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
  data: ExtendSubscriptionPayload;
}) => {
  const response = await api.put(subscriptionExtendUrl(id), data);
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
export const fetchSubscriptionDelivery = async (subscriptionId: string) => {
  const response = await api.get(`/api/dashboard/subscriptions/${subscriptionId}`);
  return response.data;
};

export const updateSubscriptionDelivery = async (
  subscriptionId: string,
  data: SubscriptionDeliveryUpdatePayload
) => {
  const response = await api.put(subscriptionDeliveryUrl(subscriptionId), data);
  return response.data;
};

// ----- Balances -----
export const fetchSubscriptionBalances = async (subscriptionId: string) => {
  const response = await api.get(subscriptionBalancesUrl(subscriptionId));
  return response.data;
};

// ----- Addon entitlements -----
export const fetchSubscriptionAddonEntitlements = async (subscriptionId: string) => {
  const response = await api.get(subscriptionAddonEntitlementsUrl(subscriptionId));
  return response.data;
};

export const replaceSubscriptionAddonEntitlements = async (
  subscriptionId: string,
  addonEntitlements: SubscriptionAddonEntitlementPayload[],
  reason: string
) => {
  const response = await api.patch(subscriptionAddonEntitlementsUrl(subscriptionId), {
    addonEntitlements,
    reason,
  });
  return response.data;
};

export const createSubscriptionAddonEntitlement = async (
  subscriptionId: string,
  data: SubscriptionAddonEntitlementPayload & { reason?: string }
) => {
  const current = await fetchSubscriptionAddonEntitlements(subscriptionId);
  const addonEntitlements = [
    ...(current.data?.addonEntitlements ?? []),
    data,
  ].map((row) => ({
    addonId: row.addonId,
    maxPerDay: row.maxPerDay,
  }));

  return replaceSubscriptionAddonEntitlements(
    subscriptionId,
    addonEntitlements,
    data.reason ?? "Dashboard addon entitlement added"
  );
};

export const deleteSubscriptionAddonEntitlement = async (
  subscriptionId: string,
  entitlementId: string,
  reason = "Dashboard addon entitlement removed"
) => {
  const current = await fetchSubscriptionAddonEntitlements(subscriptionId);
  const addonEntitlements = (current.data?.addonEntitlements ?? [])
    .filter((row: { _id?: string; id?: string; addonId?: string }) => {
      const rowId = row._id ?? row.id ?? row.addonId;
      return rowId !== entitlementId;
    })
    .map((row: { addonId: string; maxPerDay?: number }) => ({
      addonId: row.addonId,
      maxPerDay: row.maxPerDay,
    }));

  return replaceSubscriptionAddonEntitlements(
    subscriptionId,
    addonEntitlements,
    reason
  );
};

// ----- Manual Deduction -----
export const searchSubscriptionsByPhone = async (phone: string) => {
  try {
    const response = await api.get(`/api/dashboard/subscriptions/search?phone=${encodeURIComponent(phone)}`);
    return response.data;
  } catch (error: unknown) {
    // 404 means "customer not found" — treat as empty result, not an error
    if ((error as ApiStatusError)?.response?.status === 404) {
      return { data: { customer: null, subscriptions: [], today: null } };
    }
    throw error;
  }
};

export const manualDeductSubscription = async ({
  id,
  data,
}: {
  id: string;
  data: {
    regularMeals: number;
    premiumMeals: number;
    reason: string;
    notes?: string;
  };
}) => {
  const response = await api.post(`/api/dashboard/subscriptions/${id}/manual-deduction`, data);
  return response.data;
};
