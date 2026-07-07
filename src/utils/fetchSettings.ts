import api from "@/lib/apis";
import type {
  DashboardSettings,
  DashboardSettingsResponse,
  RestaurantHoursPayload,
  RestaurantHoursResponse,
} from "@/types/settingsTypes";
import {
  settingEndpointUrl,
  type SettingEndpointKey,
} from "@/utils/settingsApiContract";

// ── §22 Get Dashboard Settings ──
// GET /api/dashboard/settings

export const fetchSettings = async (): Promise<DashboardSettingsResponse> => {
  const response = await api.get("/api/dashboard/settings");
  return response.data;
};

// ── §22 Update Dashboard Settings ──
// PATCH /api/dashboard/settings

export const fetchUpdateSettings = async (
  data: Partial<DashboardSettings>
): Promise<void> => {
  await api.patch("/api/dashboard/settings", data);
};

// ── §22 Get Restaurant Hours ──
// GET /api/dashboard/settings/restaurant-hours

export const fetchRestaurantHours =
  async (): Promise<RestaurantHoursResponse> => {
    const response = await api.get(
      "/api/dashboard/settings/restaurant-hours"
    );
    return response.data;
  };

// ── §22 Update Restaurant Hours ──
// PUT /api/dashboard/settings/restaurant-hours

export const fetchUpdateRestaurantHours = async (
  data: RestaurantHoursPayload
): Promise<void> => {
  await api.put("/api/dashboard/settings/restaurant-hours", data);
};

export const fetchUpdateSettingEndpoint = async (
  key: SettingEndpointKey,
  data: Record<string, unknown>
): Promise<unknown> => {
  const response = await api.put(settingEndpointUrl(key), data);
  return response.data;
};

export const fetchUpdateCutoff = (time: string) =>
  fetchUpdateSettingEndpoint("cutoff", { time });

export const fetchUpdateDeliveryWindows = (windows: string[]) =>
  fetchUpdateSettingEndpoint("delivery-windows", { windows });

export const fetchUpdateSkipAllowance = (days: number) =>
  fetchUpdateSettingEndpoint("skip-allowance", { days });

export const fetchUpdatePremiumPrice = (price: number) =>
  fetchUpdateSettingEndpoint("premium-price", { price });

export const fetchUpdateSubscriptionDeliveryFee = (
  deliveryFeeHalala: number
) =>
  fetchUpdateSettingEndpoint("subscription-delivery-fee", {
    deliveryFeeHalala,
  });

export const fetchUpdateVatPercentage = (percentage: number) =>
  fetchUpdateSettingEndpoint("vat-percentage", { percentage });

export const fetchUpdateCustomSaladBasePrice = (price: number) =>
  fetchUpdateSettingEndpoint("custom-salad-base-price", { price });

export const fetchUpdateCustomMealBasePrice = (price: number) =>
  fetchUpdateSettingEndpoint("custom-meal-base-price", { price });
