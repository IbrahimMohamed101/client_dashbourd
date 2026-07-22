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

export const courierDeliveryKeys = {
  all: ["courier-deliveries"] as const,
  today: () => ["courier-deliveries", "today"] as const,
};

export const useCourierDeliveryListQuery = () =>
  useQuery({
    queryKey: courierDeliveryKeys.today(),
    queryFn: fetchCourierDeliveryList,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    staleTime: 15_000,
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
      itemId: string;
    }) => executeCourierDeliveryAction({ action, payload, actionDef }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: courierDeliveryKeys.today(),
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["accounting-daily-report"],
        refetchType: "active",
      });
      toast.success("تم تحديث حالة التوصيل وعرض أحدث بيانات الخادم.");
    },
    onError: (
      error: Error & {
        response?: {
          data?: { message?: string; error?: string; code?: string };
        };
      }
    ) => {
      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.error;
      toast.error(backendMessage || "تعذر تحديث حالة التوصيل. حاول مرة أخرى.");
    },
  });
};
