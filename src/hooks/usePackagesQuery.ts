import { fetchGetPackagesData } from "@/utils/fetchGetPackagesData";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const packagesQueryOptions = () =>
  queryOptions({
    queryKey: ["packages"],
    queryFn: fetchGetPackagesData,
    staleTime: 1000 * 60 * 5,
  });

/**
 * Pricing is money-sensitive, so the subscription creation form must not reuse
 * an older package catalog cached by the admin package screens.
 */
export const subscriptionPackagesQueryOptions = () =>
  queryOptions({
    queryKey: ["subscription-create-packages"],
    queryFn: () => fetchGetPackagesData({ fresh: true }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

export const usePackagesQuery = () => {
  return useQuery(packagesQueryOptions());
};

export const useSubscriptionPackagesQuery = () => {
  return useQuery(subscriptionPackagesQueryOptions());
};

export default usePackagesQuery;
