import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  DashboardOpsActionRequest,
  QueueAction,
} from "@/types/dashboardOpsTypes";
import {
  executeCourierDeliveryAction,
  fetchCourierDeliveryList,
} from "@/utils/fetchCourierDeliveries";

const courierDeliveryKeys = {
  list: (date: string) => ["courier-deliveries", date] as const,
};

export const useCourierDeliveryListQuery = (date: string) =>
  useQuery({
    queryKey: courierDeliveryKeys.list(date),
    queryFn: () => fetchCourierDeliveryList(date),
    enabled: Boolean(date),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    placeholderData: (previous) => previous,
  });

export const useCourierDeliveryActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      payload,
      actionDef,
    }: {
      action: string;
      payload: DashboardOpsActionRequest;
      actionDef?: QueueAction;
    }) => executeCourierDeliveryAction({ action, payload, actionDef }),
    onSuccess: () => {
      toast.success("Delivery status updated from the backend.");
      queryClient.invalidateQueries({ queryKey: ["courier-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-daily-report"] });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update delivery status from the backend."
      );
    },
  });
};
