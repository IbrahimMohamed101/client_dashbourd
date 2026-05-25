// ── §22 Dashboard Settings Types ──
// These endpoints are marked as "not confirmed" in the README.
// Using flexible Record types to accommodate unknown shapes.

export interface DashboardSettings {
  [key: string]: unknown;
}

export interface DashboardSettingsResponse {
  status: boolean;
  data: DashboardSettings;
}

// ── Restaurant Hours ──

export interface TimeSlot {
  open: string;
  close: string;
}

export interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

export type WeekSchedule = Record<string, DaySchedule>;

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
  weekly_schedule?: WeekSchedule;
  weeklySchedule?: WeekSchedule;
  temporary_closure?: Record<string, unknown> | null;
  temporaryClosure?: Record<string, unknown> | null;
  schedule?: WeekSchedule;
  timezone?: string;
  [key: string]: unknown;
}

export interface RestaurantHoursResponse {
  status: boolean;
  data: RestaurantHours;
}
