import type { Subscription } from "@/types/subscriptionTypes";

export function hasEntitlementBatches(subscription: Subscription): boolean {
  return subscription.stacking?.hasEntitlementBatches === true;
}

export function isCombinedSubscription(subscription: Subscription): boolean {
  return subscription.stacking?.isCombinedPackage === true;
}

export function isManualDeductionAllowed(subscription: Subscription): boolean {
  return subscription.stacking?.manualDeductionAllowed !== false;
}

export function subscriptionPlanLabel(subscription: Subscription): string {
  if (isCombinedSubscription(subscription)) {
    return `متعدد الباقات (${subscription.stacking?.packageCount ?? 0})`;
  }
  return subscription.planName || subscription.plan?.name || "بدون باقة";
}
