import api from "@/lib/apis";
import type { DashboardOverviewResponse } from "@/types/dashboardHomeTypes";

export const fetchGetDashboardData = async (
  limit = 5
): Promise<DashboardOverviewResponse> => {
  try {
    const response = await api.get<DashboardOverviewResponse>(
      "/api/dashboard/overview",
      {
        params: { limit },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
