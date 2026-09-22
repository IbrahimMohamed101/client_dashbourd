import api from "@/lib/apis";
import { normalizePackagesResponse } from "@/utils/packageAdapter";

export type FetchPackagesOptions = {
  /**
   * Subscription creation must always read the latest commercial prices.
   * The regular package-management screens can continue using the shared
   * React Query cache, while creation uses a cache-busting request.
   */
  fresh?: boolean;
};

export const fetchGetPackagesData = async ({
  fresh = false,
}: FetchPackagesOptions = {}) => {
  const response = await api.get("/api/dashboard/plans", {
    ...(fresh
      ? {
          params: {
            _catalogFresh: Date.now(),
          },
        }
      : {}),
  });

  return normalizePackagesResponse(response.data);
};
