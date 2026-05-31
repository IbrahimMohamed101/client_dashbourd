import api from "@/lib/apis";
import type { Package } from "@/types/packageTypes";
import { isCanonicalSubscriptionPlanKey } from "@/constants/menuCatalog";

export const fetchGetPlanById = async (
  id: string
): Promise<{ status: boolean; data: Package }> => {
  const response = await api.get(`/api/dashboard/plans/${id}`);
  const plan = response.data?.data;

  if (plan && !isCanonicalSubscriptionPlanKey(plan.key)) {
    throw new Error("Legacy subscription plan is not editable from the dashboard.");
  }

  return response.data;
};
