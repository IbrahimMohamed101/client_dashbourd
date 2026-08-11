import type { Subscription } from "./subscriptionTypes";

export interface SubscriptionStackingPayment {
  id: string;
  status: string | null;
  type: string | null;
  provider: string | null;
  method: string | null;
  amountHalala: number;
  currency: string;
  providerReference: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

export interface SubscriptionStackingPackage {
  id: string;
  sourceType: string;
  isLegacyPackage: boolean;
  planId: string;
  planName: string | null;
  status: string;
  applicationState: string;
  requestedStartDate: string | null;
  effectiveStartDate: string | null;
  endDate: string | null;
  validityEndDate: string | null;
  daysCount: number;
  mealsPerDay: number;
  proteinGrams: number;
  totalMeals: number;
  remainingMeals: number;
  reservedMeals: number;
  consumedMeals: number;
  forfeitedMeals: number;
  fulfillment: Record<string, unknown> | null;
  pricing: Record<string, unknown> | null;
  payment: SubscriptionStackingPayment | null;
  createdAt: string | null;
}

export interface SubscriptionStackingContext {
  version: string;
  hasEntitlementBatches: boolean;
  isCombinedPackage: boolean;
  packageCount: number;
  parentSubscriptionId: string;
  parentRole: "operational_container";
  manualDeductionAllowed: boolean;
  aggregateBalance: {
    totalMeals: number;
    remainingMeals: number;
    reservedMeals: number;
    consumedMeals: number;
    forfeitedMeals: number;
  };
  packages: SubscriptionStackingPackage[];
  transactions: SubscriptionStackingPayment[];
}

declare module "./subscriptionTypes" {
  interface Subscription {
    stacking?: SubscriptionStackingContext;
  }
}

export type SubscriptionWithStacking = Subscription;
