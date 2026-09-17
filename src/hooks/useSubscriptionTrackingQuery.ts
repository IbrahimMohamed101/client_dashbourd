import { useQuery } from "@tanstack/react-query";
import { useSubscriptionDetailsQuery } from "@/hooks/useSubscriptionsQuery";
import { fetchSubscriptionTracking } from "@/utils/fetchSubscriptionTracking";
import {
  manualDeductionDisplayLabel,
  manualDeductionQuantity,
} from "@/utils/subscriptionMovementLabels";
import type { Subscription } from "@/types/subscriptionTypes";
import type { SubscriptionTrackingResponse } from "@/types/subscriptionTrackingTypes";
import type { SubscriptionTrackingDataWithProvenance } from "@/types/subscriptionMovementProvenanceTypes";

export const subscriptionTrackingQueryKey = (subscriptionId: string) =>
  ["subscription-tracking", subscriptionId] as const;

function normalizeManualDeductionLabels(
  response: SubscriptionTrackingResponse
): SubscriptionTrackingResponse {
  const tracking = response.data as SubscriptionTrackingDataWithProvenance;
  const movements = tracking.provenance?.movements;

  if (!movements?.length) return response;

  let changed = false;
  const normalizedMovements = movements.map((movement) => {
    if (movement.sourceCode !== "dashboard_manual_deduction") return movement;

    const deductedMeals = manualDeductionQuantity(movement);
    const sourceLabel = manualDeductionDisplayLabel(deductedMeals);
    const completionLabel = "تم الخصم يدويًا";

    if (
      movement.quantity === deductedMeals &&
      movement.sourceLabel === sourceLabel &&
      movement.completion.label === completionLabel
    ) {
      return movement;
    }

    changed = true;
    return {
      ...movement,
      quantity: deductedMeals,
      sourceLabel,
      completion: {
        ...movement.completion,
        label: completionLabel,
      },
    };
  });

  if (!changed) return response;

  const normalizedTracking: SubscriptionTrackingDataWithProvenance = {
    ...tracking,
    provenance: {
      ...tracking.provenance!,
      movements: normalizedMovements,
    },
  };

  return {
    ...response,
    data: normalizedTracking,
  };
}

function normalizeEntitlementBalance(
  response: SubscriptionTrackingResponse,
  subscription: Subscription | null | undefined
): SubscriptionTrackingResponse {
  const aggregate = subscription?.stacking?.hasEntitlementBatches
    ? subscription.stacking.aggregateBalance
    : null;

  if (!aggregate) return response;

  const counters = [
    aggregate.totalMeals,
    aggregate.remainingMeals,
    aggregate.reservedMeals,
    aggregate.consumedMeals,
    aggregate.forfeitedMeals,
  ].map(Number);

  if (counters.some((value) => !Number.isFinite(value))) return response;

  const [
    totalMeals,
    remainingMeals,
    reservedMeals,
    consumedMeals,
    forfeitedMeals,
  ] = counters;
  const availableMeals = Math.max(0, remainingMeals - reservedMeals);
  const accountedMeals = remainingMeals + consumedMeals + forfeitedMeals;
  const balanceDifference = Math.abs(totalMeals - accountedMeals);
  const timelineReceivedMeals = Number(
    response.data.summary.timelineReceivedMeals
  );

  const summary = response.data.summary;
  const normalizedSummary = {
    ...summary,
    totalMeals,
    consumedMeals,
    balanceConsumedMeals: consumedMeals,
    remainingMeals,
    availableMeals,
    displayRemainingMeals: remainingMeals,
    reservedMeals,
    forfeitedMeals,
    receivedMeals: Number.isFinite(timelineReceivedMeals)
      ? timelineReceivedMeals
      : summary.receivedMeals,
    balanceIntegrity: {
      ...summary.balanceIntegrity,
      status: balanceDifference === 0 ? "balanced" : "difference",
      totalMeals,
      remainingMeals,
      reservedMeals,
      consumedMeals,
      forfeitedMeals,
      accountedMeals,
      difference: balanceDifference,
    },
  };

  return {
    ...response,
    data: {
      ...response.data,
      summary: normalizedSummary,
    },
  };
}

export function useSubscriptionTrackingQuery(subscriptionId: string) {
  const { data: subscriptionResponse } = useSubscriptionDetailsQuery(subscriptionId);
  const subscription = subscriptionResponse?.data as Subscription | undefined;

  return useQuery({
    queryKey: subscriptionTrackingQueryKey(subscriptionId),
    queryFn: () => fetchSubscriptionTracking(subscriptionId),
    select: (response) =>
      normalizeEntitlementBalance(
        normalizeManualDeductionLabels(response),
        subscription
      ),
    enabled: Boolean(subscriptionId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
