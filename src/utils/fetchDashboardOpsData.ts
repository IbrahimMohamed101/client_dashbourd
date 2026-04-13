import api from "@/lib/apis";
import type {
  DashboardOpsListResponse,
  DashboardOpsActionResponse,
  DashboardOpsActionRequest,
} from "@/types/dashboardOpsTypes";

// ── Fetch all ops for a date ──

export const fetchDashboardOpsList = async (
  date: string,
): Promise<DashboardOpsListResponse> => {
  const response = await api.get("/api/dashboard/ops/list", {
    params: { date },
  });
  return response.data;
};

// ── Full-text search across ops ──

export const fetchDashboardOpsSearch = async (
  query: string,
): Promise<DashboardOpsListResponse> => {
  const response = await api.get("/api/dashboard/ops/search", {
    params: { q: query },
  });
  return response.data;
};

// ── Execute an action (dispatch / delivered / cancel / arriving_soon) ──

export const executeDashboardOpsAction = async (
  action: string,
  payload: DashboardOpsActionRequest,
): Promise<DashboardOpsActionResponse> => {
  const response = await api.post(
    `/api/dashboard/ops/actions/${action}`,
    payload,
  );
  return response.data;
};
