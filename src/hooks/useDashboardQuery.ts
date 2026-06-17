import { fetchGetDashboardData } from "@/utils/fetchGetDashboardData";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const dashboardQueryOptions = (limit = 5) =>
  queryOptions({
    queryKey: ["dashboard", limit],
    queryFn: () => fetchGetDashboardData(limit),
    staleTime: 1000 * 60 * 5,
  });

export const UseDashboardQuery = () => {
  return useQuery(dashboardQueryOptions());
};

export default UseDashboardQuery;
