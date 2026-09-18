import type { Subscription, SubscriptionPurchase } from "@/types/subscriptionTypes";

export function hasEntitlementBatches(subscription: Subscription): boolean {
  return subscription.stacking?.hasEntitlementBatches === true;
}

export function isCombinedSubscription(subscription: Subscription): boolean {
  return subscription.stacking?.isCombinedPackage === true;
}

export function isManualDeductionAllowed(subscription: Subscription): boolean {
  if (subscription.status !== "active") return false;
  return subscription.stacking?.manualDeductionAllowed !== false;
}

export function subscriptionRelationshipLabel(subscription: Subscription): string {
  if (isCombinedSubscription(subscription)) {
    return "رصيد مجمع";
  }
  if (hasEntitlementBatches(subscription)) {
    return "اشتراك فعلي";
  }
  return "اشتراك مستقل";
}

export function subscriptionPurchaseCount(subscription: Subscription): number {
  return subscription.stacking?.packageCount ?? 0;
}

export function subscriptionPlanLabel(subscription: Subscription): string {
  if (isCombinedSubscription(subscription)) {
    return `متعدد الباقات (${subscription.stacking?.packageCount ?? 0})`;
  }
  return subscription.planName || subscription.plan?.name || "بدون باقة";
}

function dateOnlyInRiyadh(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  ) as Record<string, string>;
  return values.year && values.month && values.day
    ? `${values.year}-${values.month}-${values.day}`
    : null;
}

export function isStackingPackageUsableNow(item: SubscriptionPurchase): boolean {
  if (["expired", "exhausted", "canceled"].includes(item.status || "")) return false;
  const start = item.effectiveStartDate || item.requestedStartDate;
  const end = item.validityEndDate || item.endDate;
  if (!start || !end) return item.status === "active";

  const today = dateOnlyInRiyadh(new Date());
  const startDate = dateOnlyInRiyadh(start);
  const endDate = dateOnlyInRiyadh(end);
  if (!today || !startDate || !endDate) return item.status === "active";
  return startDate <= today && today <= endDate;
}

export function currentStackingAggregateBalance(subscription: Subscription) {
  return subscription.stacking?.hasEntitlementBatches
    ? subscription.stacking.aggregateBalance
    : null;
}
