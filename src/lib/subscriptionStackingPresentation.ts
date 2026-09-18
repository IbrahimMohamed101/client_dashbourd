import type { Subscription } from "@/types/subscriptionTypes";

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
