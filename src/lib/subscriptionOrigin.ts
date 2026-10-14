export type SubscriptionOrigin = "app" | "cashier" | "mixed" | "unknown";

export function subscriptionOriginLabel(origin: SubscriptionOrigin | undefined | null): string {
  switch (origin) {
    case "app":
      return "التطبيق";
    case "cashier":
      return "الكاشير";
    case "mixed":
      return "التطبيق + الكاشير";
    default:
      return "غير محدد";
  }
}
