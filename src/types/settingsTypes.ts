export interface DashboardSettings {
  [key: string]: unknown;
}

export interface DashboardSettingsResponse {
  status: boolean;
  data: DashboardSettings;
}

export interface RestaurantHoursScheduleItem {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export interface RestaurantTemporaryClosure {
  isActive: boolean;
}

export interface RestaurantHours {
  timezone: string;
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  restaurant_hours: RestaurantHoursScheduleItem[] | null;
  weekly_schedule?: RestaurantHoursScheduleItem[] | null;
  delivery_windows: string[];
  cutoff_time: string | null;
  temporary_closure: RestaurantTemporaryClosure | null;
  temporaryClosure?: RestaurantTemporaryClosure | null;
  isOpenNow: boolean;
  [key: string]: unknown;
}

export interface RestaurantHoursPayload {
  restaurant_open_time: string;
  restaurant_close_time: string;
  restaurant_is_open: boolean;
  cutoff_time?: string;
  delivery_windows: string[];
  restaurant_hours: RestaurantHoursScheduleItem[];
  temporary_closure: RestaurantTemporaryClosure;
}

export interface RestaurantHoursResponse {
  status: boolean;
  data: RestaurantHours;
}

export interface RestaurantOpenStatePayload {
  restaurant_is_open: boolean;
}

export interface RestaurantOpenStateResponse {
  status: boolean;
  data: {
    restaurant_is_open: boolean;
    isOpen?: boolean;
  };
}