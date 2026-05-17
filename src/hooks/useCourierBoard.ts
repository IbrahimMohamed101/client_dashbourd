import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/apis";

export interface CourierQueueItem {
  subscriptionDayId: string;
  userId: string;
  userName: string;
  userPhone: string;
  status: string;
  method: "delivery" | "pickup";
  address?: {
    zone: string;
    street: string;
    city: string;
  };
  deliveryWindow?: string;
  notes?: string;
  allowedActions: string[];
}

export interface CourierQueueResponse {
  data: {
    items: CourierQueueItem[];
  };
}

export const useCourierQueueQuery = () => {
  return useQuery<CourierQueueResponse>({
    queryKey: ["courier-tasks"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await api.get(
        `/api/dashboard/courier/queue?date=${today}&status=in_preparation,out_for_delivery,fulfilled,delivery_canceled&method=delivery`
      );
      return data;
    },
    refetchInterval: 30000,
  });
};

export const useCourierActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { data } = await api.post(
        `/api/dashboard/courier/actions/${action}`,
        {
          entityType: "subscription_day",
          entityId: id,
          payload: {
            reason: `Courier action: ${action}`,
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة التوصيل بنجاح");
      queryClient.invalidateQueries({ queryKey: ["courier-tasks"] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ["courier-tasks"] });
    },
  });
};
