import api from "@/lib/apis";
import type {
  DashboardOpsActionRequest,
  DashboardOpsActionResponse,
  DashboardOpsListResponse,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";
import { normalizeOperationsQueueItem } from "@/lib/operationsBoard";

type CourierDeliveryResponse = {
  status: boolean;
  data?: unknown[] | { items?: unknown[] };
};

const toItems = (response: CourierDeliveryResponse): unknown[] => {
  if (Array.isArray(response.data)) return response.data;
  if (response.data && typeof response.data === "object") {
    const items = (response.data as { items?: unknown[] }).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
};

const isOrderItem = (item: UnifiedQueueItem) =>
  item.entityType === "order" || item.source === "one_time_order";

const withCourierActions = (item: UnifiedQueueItem): UnifiedQueueItem => {
  if (item.allowedActions.length > 0) return item;

  const actions = isOrderItem(item)
    ? [
        {
          id: "fulfill",
          label: "Delivered",
          color: "green",
          icon: "",
          requiresReason: false,
        },
      ]
    : [
        {
          id: "notify_arrival",
          label: "Arriving Soon",
          color: "blue",
          icon: "",
          requiresReason: false,
        },
        {
          id: "fulfill",
          label: "Delivered",
          color: "green",
          icon: "",
          requiresReason: false,
        },
        {
          id: "cancel",
          label: "Cancel",
          color: "red",
          icon: "",
          requiresReason: true,
        },
      ];

  return {
    ...item,
    allowedActions: actions,
  };
};

const normalizeCourierItem = (
  item: unknown,
  source: "subscription" | "one_time_order"
) =>
  withCourierActions(
    normalizeOperationsQueueItem(
      {
        ...(item && typeof item === "object" ? item : {}),
        source,
        mode: "delivery",
      },
      "courier-v1"
    )
  );

export const fetchCourierDeliveryList = async (
  date: string
): Promise<DashboardOpsListResponse> => {
  const [deliveriesResponse, ordersResponse] = await Promise.all([
    api.get<CourierDeliveryResponse>("/api/courier/deliveries/today", {
      params: { date },
    }),
    api.get<CourierDeliveryResponse>("/api/courier/orders/today", {
      params: { date },
    }),
  ]);

  const subscriptionItems = toItems(deliveriesResponse.data).map((item) =>
    normalizeCourierItem(item, "subscription")
  );
  const orderItems = toItems(ordersResponse.data).map((item) =>
    normalizeCourierItem(item, "one_time_order")
  );

  return {
    status: true,
    data: {
      contractVersion: "courier-v1",
      date,
      items: [...subscriptionItems, ...orderItems],
    },
  };
};

export const executeCourierDeliveryAction = async ({
  action,
  payload,
}: {
  action: string;
  payload: DashboardOpsActionRequest;
}): Promise<DashboardOpsActionResponse> => {
  const id = payload.entityId;
  const isOrder =
    payload.entityType === "order" || payload.source === "one_time_order";

  if (isOrder) {
    const response = await api.put(`/api/courier/orders/${id}/delivered`);
    return response.data;
  }

  const endpointAction =
    action === "notify_arrival"
      ? "arriving-soon"
      : action === "fulfill" || action === "delivered"
        ? "delivered"
        : "cancel";

  const response = await api.put(
    `/api/courier/deliveries/${id}/${endpointAction}`,
    payload.reason || payload.note || payload.payload?.reason
      ? {
          reason: payload.reason || payload.payload?.reason,
          note: payload.note || payload.payload?.notes,
        }
      : undefined
  );
  return response.data;
};
