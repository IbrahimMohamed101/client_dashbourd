import api from "@/lib/apis";
import { normalizePackagesResponse } from "@/utils/packageAdapter";
import { isCanonicalSubscriptionPlanKey } from "@/constants/menuCatalog";

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

  const normalized = normalizePackagesResponse(response.data);

  // Subscription creation must never surface legacy/test/duplicate plans.
  // The canonical commercial catalog is keyed by the stable subscription_*_days keys.
  if (fresh) {
    return {
      ...normalized,
      data: normalized.data.filter((pkg) => isCanonicalSubscriptionPlanKey(pkg.key)),
    };
  }

  return normalized;
};
