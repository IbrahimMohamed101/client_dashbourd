import api from "@/lib/apis";
import type {
  AddonPlanPrice,
  AddonPlanPricesResponse,
} from "@/types/addonTypes";

export type AddonPlanPricePayload = {
  addonPlanId: string;
  basePlanId: string;
  priceHalala: number;
  isActive?: boolean;
};

export const fetchAddonPlanPrices =
  async (): Promise<AddonPlanPricesResponse> => {
    const response = await api.get("/api/dashboard/addon-prices");
    return response.data;
  };

export const createAddonPlanPrice = async (
  data: AddonPlanPricePayload
): Promise<{ status: boolean; data: AddonPlanPrice }> => {
  const response = await api.post("/api/dashboard/addon-prices", data);
  return response.data;
};

export const updateAddonPlanPrice = async (
  id: string,
  data: AddonPlanPricePayload
): Promise<{ status: boolean; data: AddonPlanPrice }> => {
  const response = await api.put(`/api/dashboard/addon-prices/${id}`, data);
  return response.data;
};

export const deleteAddonPlanPrice = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/addon-prices/${id}`);
};

export const toggleAddonPlanPrice = async (
  id: string
): Promise<{ status: boolean; data: AddonPlanPrice }> => {
  const response = await api.patch(`/api/dashboard/addon-prices/${id}/toggle`);
  return response.data;
};
