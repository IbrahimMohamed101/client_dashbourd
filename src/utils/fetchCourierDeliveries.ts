import api from "@/lib/apis";
import { normalizeOperationsQueueItem } from "@/lib/operationsBoard";
import type {
  DashboardOpsActionRequest,
  DashboardOpsActionResponse,
  DashboardOpsListResponse,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

type CourierDeliveryResponse = {
  status: boolean;
  data?: unknown[] | { items?: unknown[] };
};

type CourierDto = Record<string, unknown>;

const toItems = (response: CourierDeliveryResponse): unknown[] => {
  if (Array.isArray(response.data)) return response.data;
  if (response.data && typeof response.data === "object") {
    const items = (response.data as { items?: unknown[] }).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
};

const hasFlag = (item: CourierDto, key: string) => item[key] === true;

const courierActionsFor = (
  item: CourierDto,
  source: "subscription" | "one_time_order"
): UnifiedQueueItem["allowedActions"] => {
  const actions: UnifiedQueueItem["allowedActions"] = [];

  if (source === "subscription" && hasFlag(item, "canCourierPickup")) {
    actions.push({
      id: "dispatch",
      label: "استلام للتوصيل",
      color: "blue",
      icon: "truck",
      requiresReason: false,
    });
  }

  if (hasFlag(item, "canMarkArrivingSoon")) {
    actions.push({
      id: "notify_arrival",
      label: "قريب من العميل",
      color: "blue",
      icon: "bell",
      requiresReason: false,
    });
  }

  if (hasFlag(item, "canMarkDelivered")) {
    actions.push({
      id: "fulfill",
      label: "تم التسليم",
      color: "green",
      icon: "check",
      requiresReason: false,
    });
  }

  if (hasFlag(item, "canCancel")) {
    actions.push({
      id: "cancel",
      label: "تعذر التوصيل",
      color: "red",
      icon: "x",
      requiresReason: true,
    });
  }

  return actions;
};

const adaptCourierDto = (
  item: unknown,
  source: "subscription" | "one_time_order"
) => {
  const record = item && typeof item === "object" ? (item as CourierDto) : {};
  const deliveryAddress = record.deliveryAddress;
  const id = String(record.id ?? "");
  const entityType = source === "one_time_order" ? "order" : "subscription_day";
  const mealCount = Number(record.mealCount ?? 0);
  const addonCount = Number(record.addonCount ?? 0);
  const premiumUpgradeCount = Number(record.premiumUpgradeCount ?? 0);

  return {
    ...record,
    id,
    entityId: id,
    entityType,
    source,
    type: source === "one_time_order" ? "order" : "subscription",
    mode: "delivery",
    reference: record.orderNumber ?? record.subscriptionDayId ?? id,
    customer: {
      name: record.customerName,
      phone: record.customerPhone,
    },
    context: {
      date: record.scheduledDate,
      window: record.deliveryWindow,
      address: deliveryAddress,
      mealCount,
    },
    delivery: {
      deliveryId: id,
      status: record.status,
      date: record.scheduledDate,
      address: deliveryAddress,
      window: record.deliveryWindow,
      deliveryWindow: record.deliveryWindow,
      zone:
        typeof record.deliveryZone === "string"
          ? { id: record.deliveryZone, name: record.deliveryZone }
          : null,
    },
    orderSummary: {
      mealCount,
      addonCount,
      itemCount: mealCount + addonCount + premiumUpgradeCount,
      hasPremium: premiumUpgradeCount > 0,
      hasAddons: addonCount > 0,
    },
    allowedActions: courierActionsFor(record, source),
  };
};

const normalizeCourierItem = (
  item: unknown,
  source: "subscription" | "one_time_order"
) =>
  normalizeOperationsQueueItem(adaptCourierDto(item, source), "courier-v1");

export const fetchCourierDeliveryList = async (
  date: string
): Promise<DashboardOpsListResponse> => {
  const [deliveriesResponse, ordersResponse] = await Promise.all([
    api.get<CourierDeliveryResponse>("/api/courier/deliveries/today"),
    api.get<CourierDeliveryResponse>("/api/courier/orders/today"),
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
    const endpointAction =
      action === "notify_arrival"
        ? "arriving-soon"
        : action === "cancel"
          ? "cancel"
          : "delivered";

    const response = await api.put(
      `/api/courier/orders/${id}/${endpointAction}`,
      action === "cancel"
        ? {
            reason:
              payload.reason ||
              payload.payload?.reason ||
              "customer_unreachable",
            note: payload.note || payload.payload?.notes,
          }
        : undefined
    );

    return response.data;
  }

  const endpointAction =
    action === "dispatch"
      ? "collect"
      : action === "notify_arrival"
        ? "arriving-soon"
        : action === "fulfill" || action === "delivered"
          ? "delivered"
          : "cancel";

  const response = await api.put(
    `/api/courier/deliveries/${id}/${endpointAction}`,
    action === "cancel"
      ? {
          reason:
            payload.reason ||
            payload.payload?.reason ||
            "customer_unreachable",
          note: payload.note || payload.payload?.notes,
        }
      : undefined
  );

  return response.data;
};
