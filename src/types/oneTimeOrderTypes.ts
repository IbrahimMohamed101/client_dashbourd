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

export function getOneTimeOrderStatusColor(status: OneTimeOrderStatus | string) {
  switch (status) {
    case "pending_payment":
      return { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/20", dot: "bg-yellow-500" };
    case "confirmed":
      return { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", dot: "bg-blue-500" };
    case "in_preparation":
      return { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/20", dot: "bg-orange-500" };
    case "ready_for_pickup":
      return { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-500/20", dot: "bg-teal-500" };
    case "fulfilled":
      return { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", dot: "bg-emerald-500" };
    case "cancelled":
      return { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/20", dot: "bg-red-500" };
    case "expired":
      return { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-500/20", dot: "bg-gray-500" };
    default:
      return { bg: "bg-gray-500/10", text: "text-gray-600", border: "border-gray-500/20", dot: "bg-gray-500" };
  }
}

export function getOneTimeOrderStatusLabel(status: OneTimeOrderStatus | string): string {
  switch (status) {
    case "pending_payment": return "بانتظار الدفع";
    case "confirmed": return "مؤكد";
    case "in_preparation": return "قيد التحضير";
    case "ready_for_pickup": return "جاهز للاستلام";
    case "fulfilled": return "تم الاستلام";
    case "cancelled": return "ملغي";
    case "expired": return "منتهي الصلاحية";
    default: return status;
  }
}

export function isOneTimeOrderFinal(status: OneTimeOrderStatus | string): boolean {
  return status === "fulfilled" || status === "cancelled" || status === "expired";
}
