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
  schedule: WeekSchedule;
  timezone?: string;
  [key: string]: unknown;
}

export interface RestaurantHoursResponse {
  status: boolean;
  data: RestaurantHours;
}
