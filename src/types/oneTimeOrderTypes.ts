export type OneTimeOrderStatus =
  | "pending_payment" | "confirmed" | "in_preparation"
  | "ready_for_pickup" | "fulfilled" | "cancelled" | "expired";

export type OneTimeOrderAction =
  | "prepare" | "ready_for_pickup" | "fulfill" | "cancel";

export const UNSUPPORTED_ONE_TIME_ACTIONS = [
  "dispatch",
  "notify_arrival",
  "courier_fulfill",
  "delivery_assignment",
  "delivery_zone_assignment",
  "delivery_address_edit",
  "delivery_window_edit",
  "reopen",
] as const;

export function isUnsupportedOneTimeOrderAction(action: string): boolean {
  return (UNSUPPORTED_ONE_TIME_ACTIONS as readonly string[]).includes(action);
}

export function isOneTimeOrderActionAllowed(action: string): boolean {
  return !isUnsupportedOneTimeOrderAction(action);
}
