import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/apis";
import { isUnsupportedOneTimeOrderAction } from "@/types/oneTimeOrderTypes";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

export interface KitchenQueueResponse {
  data: {
    items: UnifiedQueueItem[];
  };
}

// ── Helper: check if this is a one-time order ──
export const isOneTimeOrder = (item: UnifiedQueueItem): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};

export const useKitchenQueueQuery = () => {
  return useQuery<KitchenQueueResponse>({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await api.get(
        `/api/dashboard/kitchen/queue?date=${today}&status=open,locked,confirmed,in_preparation,ready_for_pickup,out_for_delivery&method=all&q=&zoneId=&branchId=`
      );
      return data;
    },
    refetchInterval: 30000,
  });
};

export const useKitchenActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      item,
      action,
      reason: actionReason,
      notes: actionNotes,
    }: {
      item: UnifiedQueueItem;
      action: string;
      reason?: string;
      notes?: string;
    }) => {
      // Block unsupported actions for pickup-only one-time orders
      if (isOneTimeOrder(item) && isUnsupportedOneTimeOrderAction(action)) {
        throw new Error(
          `Action "${action}" is not supported for pickup-only one-time orders`
        );
      }

      if (isOneTimeOrder(item)) {
        // One-Time Order: use order-specific action endpoint
        const orderId = item.entityId || item.id;
        const { data } = await api.post(
          `/api/dashboard/orders/${orderId}/actions/${action}`,
          {
            reason: actionReason || `Kitchen action: ${action}`,
            notes: actionNotes || item.notes,
          }
        );
        return data;
      } else {
        // Subscription Day: use unified kitchen action endpoint
        const { data } = await api.post(
          `/api/dashboard/kitchen/actions/${action}`,
          {
            entityId: item.subscriptionDayId || item.id,
            entityType: "subscription_day",
            payload: {
              reason: actionReason || `Kitchen action: ${action}`,
              notes: actionNotes || item.notes,
            },
          }
        );
        return data;
      }
    },
    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
      // Refresh data after errors
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });
};
