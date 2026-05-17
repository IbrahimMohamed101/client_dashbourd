import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/apis";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import type { OneTimeOrderAction, OneTimeOrderActionRequest } from "@/types/oneTimeOrderTypes";
import { useOneTimeOrderActionMutation } from "@/hooks/useOneTimeOrdersQuery";

export const isOneTimeOrder = (item: UnifiedQueueItem): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};

export const usePickupAction = () => {
  const otoActionMutation = useOneTimeOrderActionMutation();
  const queryClient = useQueryClient();

  const subscriptionActionMutation = useMutation({
    mutationFn: async ({
      item,
      action,
      reason,
      notes,
      pickupCode,
    }: {
      item: UnifiedQueueItem;
      action: string;
      reason?: string;
      notes?: string;
      pickupCode?: string;
    }) => {
      const { data } = await api.post(`/api/dashboard/pickup/actions/${action}`, {
        entityId: item.subscriptionDayId || item.id,
        entityType: "subscription_day",
        payload: {
          reason: reason || `Pickup action: ${action}`,
          notes: notes || item.notes,
          ...(pickupCode ? { pickupCode } : {}),
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-orders"] });
    },
  });

  const executeAction = async ({
    item,
    action,
    reason,
    notes,
    pickupCode,
  }: {
    item: UnifiedQueueItem;
    action: string;
    reason?: string;
    notes?: string;
    pickupCode?: string;
  }) => {
    if (isOneTimeOrder(item)) {
      const orderId = item.entityId || item.id;
      const body: OneTimeOrderActionRequest = {};
      if (reason) body.reason = reason;
      if (notes) body.notes = notes;
      if (pickupCode) body.pickupCode = pickupCode;

      await otoActionMutation.mutateAsync({
        orderId,
        action: action as OneTimeOrderAction,
        body,
      });
    } else {
      await subscriptionActionMutation.mutateAsync({
        item,
        action,
        reason,
        notes,
        pickupCode,
      });
    }
  };

  return {
    executeAction,
    isPending: otoActionMutation.isPending || subscriptionActionMutation.isPending,
  };
};
