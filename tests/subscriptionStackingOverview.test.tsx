// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SubscriptionStackingOverview } from "../src/components/pages/subscriptions/SubscriptionStackingOverview";
import type {
  Subscription,
  SubscriptionAggregateBalance,
  SubscriptionPurchase,
} from "../src/types/subscriptionTypes";

afterEach(cleanup);

function packageFixture(
  status: "expired" | "paid_scheduled",
): SubscriptionPurchase {
  const scheduled = status === "paid_scheduled";
  return {
    id: scheduled ? "scheduled-batch" : "historical-batch",
    purchaseId: scheduled ? "scheduled-purchase" : "historical-purchase",
    displayId: null,
    sourceType: "renewal",
    isLegacyPackage: false,
    planId: "plan-one",
    planName: scheduled ? "باقة مجدولة" : "باقة تاريخية",
    status,
    applicationState: null,
    requestedStartDate: scheduled ? "2030-01-01" : "2020-01-01",
    effectiveStartDate: scheduled ? "2030-01-01" : "2020-01-01",
    endDate: scheduled ? "2030-01-26" : "2020-01-26",
    validityEndDate: scheduled ? "2030-01-26" : "2020-01-26",
    daysCount: 26,
    mealsPerDay: 2,
    proteinGrams: 150,
    totalMeals: 52,
    remainingMeals: 12,
    reservedMeals: 0,
    consumedMeals: 40,
    forfeitedMeals: 0,
    fulfillment: null,
    pricing: null,
    payment: null,
    createdAt: null,
  };
}

function subscriptionFixture(
  aggregateBalance: SubscriptionAggregateBalance | null,
  packages: SubscriptionPurchase[] = [packageFixture("expired")],
): Subscription {
  return {
    _id: "6a84a15278fc36075734a209",
    status: "expired",
    totalMeals: 999,
    remainingMeals: 888,
    stacking: {
      version: "dashboard_stacking_read.v1",
      hasEntitlementBatches: true,
      isCombinedPackage: false,
      packageCount: packages.length,
      presentationMode: "single_batch",
      parentSubscriptionId: "6a84a15278fc36075734a209",
      parentRole: "operational_container",
      manualDeductionAllowed: true,
      aggregateBalance,
      packages,
      transactions: [],
    },
  } as Subscription;
}

describe("subscription stacking overview nullable aggregate", () => {
  it("keeps historical package details visible when the daily projection is null", () => {
    render(<SubscriptionStackingOverview subscription={subscriptionFixture(null)} />);

    expect(screen.getByRole("status")).toHaveTextContent("لا يوجد رصيد مجمع حالي");
    expect(screen.getByText("باقة تاريخية")).toBeInTheDocument();
    expect(screen.getByText("الباقات المرتبطة")).toBeInTheDocument();
    expect(screen.getByText("غير متاح للاستخدام")).toBeInTheDocument();
    expect(screen.queryByText("إجمالي الوجبات")).not.toBeInTheDocument();
    expect(screen.queryByText("888")).not.toBeInTheDocument();
  });

  it("keeps future paid packages visible without inventing an available balance", () => {
    render(
      <SubscriptionStackingOverview
        subscription={subscriptionFixture(null, [packageFixture("paid_scheduled")])}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("لا يوجد رصيد مجمع حالي");
    expect(screen.getByText("باقة مجدولة")).toBeInTheDocument();
    expect(screen.getByText("غير متاح حاليًا")).toBeInTheDocument();
    expect(screen.queryByText("إجمالي الوجبات")).not.toBeInTheDocument();
  });

  it("continues rendering current backend totals when the projection exists", () => {
    const aggregateBalance = {
      totalMeals: 60,
      remainingMeals: 44,
      reservedMeals: 1,
      consumedMeals: 15,
      forfeitedMeals: 0,
    };

    render(
      <SubscriptionStackingOverview
        subscription={subscriptionFixture(aggregateBalance)}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("إجمالي الوجبات").nextElementSibling).toHaveTextContent("60");
    expect(screen.getByText("الرصيد المجمع المسجل").nextElementSibling).toHaveTextContent("44");
    expect(screen.getByText("باقة تاريخية")).toBeInTheDocument();
  });
});
