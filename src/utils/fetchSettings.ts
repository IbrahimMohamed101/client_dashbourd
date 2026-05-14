import api from "@/lib/apis";
import type {
  DashboardSettings,
  DashboardSettingsResponse,
  RestaurantHours,
  RestaurantHoursResponse,
} from "@/types/settingsTypes";

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
  data: RestaurantHours
): Promise<void> => {
  await api.put("/api/dashboard/settings/restaurant-hours", data);
};
