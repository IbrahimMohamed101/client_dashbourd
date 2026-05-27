import type { PickupLocation } from "@/types/pickupTypes";

export interface TemporaryClosure {
  isActive?: boolean;
  reason?: string;
  message?: string;
  from?: string;
  to?: string;
  [key: string]: unknown;
}

export interface RestaurantScheduleRow {
  dayOfWeek?: number;
  weekday?: number;
  day?: number;
  openTime?: string;
  closeTime?: string;
  restaurant_open_time?: string;
  restaurant_close_time?: string;
  opensAt?: string;
  closesAt?: string;
  from?: string;
  to?: string;
  isClosed?: boolean;
  closed?: boolean;
  [key: string]: unknown;
}

export interface DashboardSettings {
  cutoff_time: string;
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open?: boolean;
  restaurant_hours?: RestaurantScheduleRow[] | null;
  temporary_closure?: TemporaryClosure | null;
  delivery_windows: string[];
  pickup_windows?: string[];
  pickup_locations: PickupLocation[];
  skip_allowance: number;
  premium_price: number;
  subscription_delivery_fee_halala: number;
  vat_percentage: number;
  one_time_meal_price: number;
  one_time_premium_price: number;
  one_time_delivery_fee: number;
  custom_salad_base_price: number;
  custom_meal_base_price: number;
  [key: string]: unknown;
}

export interface DashboardSettingsResponse {
  status: boolean;
  data: DashboardSettings;
}

// ── Restaurant Hours ──

export interface RestaurantHours {
  restaurant_open_time?: string;
  restaurant_close_time?: string;
  openTime?: string;
  closeTime?: string;
  deliveryWindows?: string[];
  delivery_windows?: string[];
  cutoffTime?: string;
  cutoff_time?: string;
  restaurant_is_open?: boolean;
  isOpen?: boolean;
  restaurant_hours?: RestaurantScheduleRow[] | null;
  weekly_schedule?: RestaurantScheduleRow[];
  weeklySchedule?: RestaurantScheduleRow[];
  temporary_closure?: TemporaryClosure | null;
  temporaryClosure?: TemporaryClosure | null;
  schedule?: RestaurantScheduleRow[];
  timezone?: string;
  isOpenNow?: boolean;
  [key: string]: unknown;
}

export interface RestaurantHoursResponse {
  status: boolean;
  data: RestaurantHours;
}
