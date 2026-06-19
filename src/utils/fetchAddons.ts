import api from "@/lib/apis";
import type {
  AddonPlanPricesResponse,
  AddonPlansResponse,
  AddonsResponse,
} from "@/types/addonTypes";

export const fetchAddons = async (): Promise<AddonsResponse> => {
  const response = await api.get("/api/dashboard/addons");
  return response.data;
};

export const fetchAddonPlans = async (): Promise<AddonPlansResponse> => {
  const response = await api.get("/api/dashboard/addon-plans");
  return response.data;
};

export const fetchAddonPrices =
  async (): Promise<AddonPlanPricesResponse> => {
    const response = await api.get("/api/dashboard/addon-prices");
    return response.data;
  };

export const fetchAddonItems = async (): Promise<AddonsResponse> => {
  const response = await api.get("/api/dashboard/addon-items");
  return response.data;
};
