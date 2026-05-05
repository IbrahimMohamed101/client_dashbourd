import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchOneTimeOrders,
  fetchOneTimeOrderDetail,
  executeOneTimeOrderAction,
  fetchKitchenQueue,
  fetchPickupQueue,
  executeUnifiedOpsAction,
} from "@/utils/fetchOneTimeOrders";
import type {
  OneTimeOrderListParams,
  OneTimeOrderActionRequest,
  OneTimeOrderAction,
  UnifiedOpsActionRequest,
  OneTimeOrderErrorCode,
} from "@/types/oneTimeOrderTypes";

// ── Query keys ──

const KEYS = {
  list: (params: OneTimeOrderListParams) =>
    ["oneTimeOrders", "list", params] as const,
  detail: (orderId: string) => ["oneTimeOrders", "detail", orderId] as const,
  kitchenQueue: (params: {
    date?: string;
    status?: string;
    method?: string;
    q?: string;
    zoneId?: string;
    branchId?: string;
  }) => ["oneTimeOrders", "kitchenQueue", params] as const,
  pickupQueue: (params: {
    date?: string;
    status?: string;
    method?: string;
    q?: string;
    branchId?: string;
  }) => ["oneTimeOrders", "pickupQueue", params] as const,
};

// ── List one-time orders ──

export const useOneTimeOrdersListQuery = (
  params: OneTimeOrderListParams = {}
) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => fetchOneTimeOrders(params),
    refetchInterval: 30_000,
  });

// ── Order detail ──

export const useOneTimeOrderDetailQuery = (orderId: string) =>
  useQuery({
    queryKey: KEYS.detail(orderId),
    queryFn: () => fetchOneTimeOrderDetail(orderId),
    enabled: !!orderId,
  });

// ── Kitchen queue ──

export const useKitchenQueueQuery = (
  params: {
    date?: string;
    status?: string;
    method?: string;
    q?: string;
    zoneId?: string;
    branchId?: string;
  } = {}
) =>
  useQuery({
    queryKey: KEYS.kitchenQueue(params),
    queryFn: () => fetchKitchenQueue(params),
    enabled: !!params.date,
    refetchInterval: 30_000,
  });

// ── Pickup queue ──

export const usePickupQueueQuery = (
  params: {
    date?: string;
    status?: string;
    method?: string;
    q?: string;
    branchId?: string;
  } = {}
) =>
  useQuery({
    queryKey: KEYS.pickupQueue(params),
    queryFn: () => fetchPickupQueue(params),
    enabled: !!params.date,
    refetchInterval: 30_000,
  });

// ── Action mutation (prepare / ready_for_pickup / fulfill / cancel) ──
// Do NOT use subscription day endpoints for one-time orders.

export const useOneTimeOrderActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      action,
      body,
    }: {
      orderId: string;
      action: OneTimeOrderAction;
      body?: OneTimeOrderActionRequest;
    }) => executeOneTimeOrderAction(orderId, action, body ?? {}),

    onSuccess: (data) => {
      const newStatus = data?.data?.status;
      toast.success(
        newStatus
          ? `تم تحديث حالة الطلب إلى: ${newStatus}`
          : "تم تنفيذ الإجراء بنجاح"
      );
      // Invalidate all one-time order queries
      queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
      // Also invalidate kitchen queries since the order status changed
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      // Keep the ops board in sync too
      queryClient.invalidateQueries({ queryKey: ["dashboardOpsList"] });
    },

    onError: (
      error: Error & {
        response?: {
          data?: { code?: OneTimeOrderErrorCode; message?: string };
        };
      }
    ) => {
      const errorCode = error?.response?.data?.code;
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء تنفيذ الإجراء";

      // Handle specific error codes per spec
      switch (errorCode) {
        case "INVALID_TRANSITION":
          toast.error("الانتقال غير مسموح. سيتم تحديث الحالة الحالية.");
          // Refresh after transition errors – another staff member may have acted
          queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
          break;
        case "ORDER_NOT_FOUND":
          toast.error("الطلب غير موجود");
          queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
          break;
        case "FORBIDDEN":
          toast.error("ليس لديك صلاحية لتنفيذ هذا الإجراء");
          break;
        case "REOPEN_NOT_SUPPORTED":
          toast.error("لا يمكن إعادة فتح طلب نهائي");
          break;
        case "ACTION_NOT_ALLOWED":
          toast.error("هذا الإجراء غير مسموح لهذا الطلب");
          queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
          break;
        case "PAYMENT_NOT_PAID":
          toast.error("لا يمكن تنفيذ إجراءات تشغيلية لطلب غير مدفوع");
          break;
        case "ORDER_FINAL":
          toast.error("هذا الطلب في حالة نهائية");
          queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
          break;
        case "ONE_TIME_ORDER_DELIVERY_DISABLED":
          toast.error("طلبات لمرة واحدة متاحة للاستلام من الفرع فقط");
          break;
        case "INVALID_OBJECT_ID":
          toast.error("معرف الطلب غير صالح");
          break;
        default:
          toast.error(msg);
      }
    },
  });
};

// ── Unified ops action mutation ──
// POST /api/dashboard/ops/actions/:action
// Always include entityType=order and source=one_time_order

export const useUnifiedOpsActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      payload,
    }: {
      action: string;
      payload: UnifiedOpsActionRequest;
    }) => executeUnifiedOpsAction(action, payload),

    onSuccess: () => {
      toast.success("تم تنفيذ الإجراء بنجاح");
      queryClient.invalidateQueries({ queryKey: ["oneTimeOrders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenOperations"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenSummary"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardOpsList"] });
    },

    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      const msg =
        error?.response?.data?.message || "حدث خطأ أثناء تنفيذ الإجراء";
      toast.error(msg);
    },
  });
};
