import { describe, expect, it } from "vitest";
import type { Subscription } from "@/types/subscriptionTypes";
import {
  hasEntitlementBatches,
  isCombinedSubscription,
  isManualDeductionAllowed,
  subscriptionPlanLabel,
} from "./subscriptionStackingPresentation";

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    planName: "الباقة الأصلية",
    plan: { id: "plan-a", name: "الباقة الأصلية" },
    ...overrides,
  } as Subscription;
}

describe("subscription stacking presentation", () => {
  it("preserves legacy subscriptions", () => {
    const row = subscription();
    expect(hasEntitlementBatches(row)).toBe(false);
    expect(isCombinedSubscription(row)).toBe(false);
    expect(isManualDeductionAllowed(row)).toBe(true);
    expect(subscriptionPlanLabel(row)).toBe("الباقة الأصلية");
  });

  it("labels combined packages and fails manual deduction closed", () => {
    const row = subscription({
      stacking: {
        version: "dashboard_stacking_read.v1",
        hasEntitlementBatches: true,
        isCombinedPackage: true,
        packageCount: 2,
        parentSubscriptionId: "parent-a",
        parentRole: "operational_container",
        manualDeductionAllowed: false,
        aggregateBalance: {
          totalMeals: 130,
          remainingMeals: 72,
          reservedMeals: 0,
          consumedMeals: 58,
          forfeitedMeals: 0,
        },
        packages: [],
        transactions: [],
      },
    });
    expect(hasEntitlementBatches(row)).toBe(true);
    expect(isCombinedSubscription(row)).toBe(true);
    expect(isManualDeductionAllowed(row)).toBe(false);
    expect(subscriptionPlanLabel(row)).toBe("متعدد الباقات (2)");
  });
});
