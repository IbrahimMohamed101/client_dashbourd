import api from "@/lib/apis";
import type {
  DashboardOpsListResponse,
  DashboardOpsActionResponse,
  DashboardOpsActionRequest,
} from "@/types/dashboardOpsTypes";
import { isOneTimeOrderActionAllowed } from "@/types/oneTimeOrderTypes";

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

// ── Execute an action (dispatch / delivered / cancel / arriving_soon / prepare / ready_for_pickup / fulfill) ──
// For one-time orders: always include entityType=order and source=one_time_order
// Block unsupported actions for pickup-only one-time orders

export const executeDashboardOpsAction = async (
  action: string,
  payload: DashboardOpsActionRequest
): Promise<DashboardOpsActionResponse> => {
  // Block unsupported actions for pickup-only one-time orders
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
