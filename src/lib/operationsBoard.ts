import type {
  DashboardOpsActionRequest,
  DashboardOpsListResponse,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

export const OPERATIONS_SCREENS = ["kitchen", "pickup", "courier"] as const;

export type OperationsScreen = (typeof OPERATIONS_SCREENS)[number];

export interface OperationsScreenConfig {
  label: string;
  screens: OperationsScreen[];
}

const ALL_OPERATIONS_SCREENS: OperationsScreen[] = [
  "kitchen",
  "pickup",
  "courier",
];

const ROLE_SCREEN_MAP: Record<string, OperationsScreenConfig> = {
  kitchen: {
    label: "المطبخ والاستلام",
    screens: ["kitchen", "pickup"],
  },
  courier: { label: "التوصيل", screens: ["courier"] },
  admin: {
    label: "جميع العمليات",
    screens: ALL_OPERATIONS_SCREENS,
  },
  superadmin: {
    label: "جميع العمليات",
    screens: ALL_OPERATIONS_SCREENS,
  },
};

export function getScreensForRole(
  role: string | null | undefined
): OperationsScreenConfig {
  if (!role) return { label: "", screens: [] };
  return ROLE_SCREEN_MAP[role] || { label: "", screens: [] };
}

export function getSafeOperationsTab(
  tab: string | undefined,
  visibleScreens: readonly OperationsScreen[]
): OperationsScreen {
  if (tab && visibleScreens.includes(tab as OperationsScreen)) {
    return tab as OperationsScreen;
  }

  return visibleScreens[0] || "kitchen";
}

export function getEndpointForAction(action: string): string {
  return `/api/dashboard/ops/actions/${action}`;
}

export function buildOperationsActionPayload(
  item: UnifiedQueueItem,
  action: string,
  reason?: string,
  notes?: string,
  pickupCode?: string
): DashboardOpsActionRequest {
  return {
    entityId: item.entityId,
    entityType: item.entityType,
    source: item.source,
    action,
    reason,
    note: notes,
    payload: {
      reason,
      notes,
      pickupCode,
    },
  };
}

export function getItemsByStatuses(
  items: UnifiedQueueItem[],
  statuses: readonly string[]
): UnifiedQueueItem[] {
  return items.filter((item) => statuses.includes(item.status));
}

export function getPickupItems(
  items: UnifiedQueueItem[] = []
): UnifiedQueueItem[] {
  return items.filter(
    (item) =>
      item.mode === "pickup" || (item.source === "one_time_order" && !item.mode)
  );
}

export function getCourierItems(
  items: UnifiedQueueItem[] = []
): UnifiedQueueItem[] {
  return items.filter(
    (item) =>
      item.mode === "delivery" && item.source !== "subscription_pickup_request"
  );
}

type RawQueueRecord = Record<string, unknown>;

function asRecord(value: unknown): RawQueueRecord | null {
  return value && typeof value === "object" ? (value as RawQueueRecord) : null;
}

function normalizeAllowedActions(raw: unknown): UnifiedQueueItem["allowedActions"] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          id: entry,
          label: entry,
          color: "default",
          icon: "",
          requiresReason: false,
        };
      }

      const action = asRecord(entry);
      if (!action) return null;

      const id = String(action.id || "");
      if (!id) return null;

      return {
        id,
        label: String(action.label || id),
        color: String(action.color || "default"),
        icon: String(action.icon || ""),
        requiresReason: Boolean(action.requiresReason),
      };
    })
    .filter((action): action is NonNullable<typeof action> => action !== null);
}

function normalizeCustomer(raw: RawQueueRecord): UnifiedQueueItem["customer"] {
  const user = asRecord(raw.user);
  const customer = asRecord(raw.customer);
  const source = customer || user;

  return {
    id: String(source?.id || raw.userId || ""),
    name: String(source?.name || "—"),
    phone: String(source?.phone || ""),
  };
}

function normalizeMode(raw: RawQueueRecord): UnifiedQueueItem["mode"] {
  const candidate = String(
    raw.mode || raw.deliveryMethod || raw.deliveryMode || "delivery"
  );
  return candidate === "pickup" ? "pickup" : "delivery";
}

function normalizeMealSlots(raw: unknown): UnifiedQueueItem["mealSlots"] {
  if (!Array.isArray(raw)) return [];

  return raw.map((slot, index) => {
    const record = asRecord(slot) || {};
    const slotItems = Array.isArray(record.items) ? record.items : [];

    return {
      slot: String(record.slot || `slot-${index + 1}`),
      items: slotItems.map((entry) => {
        const item = asRecord(entry) || {};
        return {
          name: String(item.name || "عنصر"),
          quantity: Number(item.quantity || item.qty || 1),
          notes: typeof item.notes === "string" ? item.notes : undefined,
        };
      }),
    };
  });
}

function normalizeLineItems(raw: unknown): UnifiedQueueItem["items"] {
  if (!Array.isArray(raw)) return undefined;

  return raw.map((entry, index) => {
    const item = asRecord(entry) || {};
    return {
      id: String(item.id || item._id || index),
      name: String(item.name || "عنصر"),
      quantity: Number(item.quantity || item.qty || 1),
      notes: typeof item.notes === "string" ? item.notes : undefined,
    };
  });
}

/** Maps heterogeneous kitchen/pickup/courier queue rows to UnifiedQueueItem. */
export function normalizeOperationsQueueItem(raw: unknown): UnifiedQueueItem {
  const record = asRecord(raw) || {};
  const delivery = asRecord(record.delivery);
  const pickup = asRecord(record.pickup);
  const context = asRecord(record.context);
  const ui = asRecord(record.ui);
  const entityId = String(
    record.entityId || record.id || record.subscriptionDayId || record.orderId || ""
  );
  const entityType = (record.entityType ||
    record.type ||
    "subscription_day") as UnifiedQueueItem["entityType"];
  const source = (record.source ||
    (entityType === "order"
      ? "one_time_order"
      : entityType === "subscription_pickup_request"
        ? "subscription_pickup_request"
        : "subscription")) as UnifiedQueueItem["source"];
  const mode = normalizeMode(record);
  const status = String(record.status || "open");

  return {
    id: String(record.id || entityId),
    entityId,
    entityType,
    source,
    type: (record.type || entityType) as UnifiedQueueItem["type"],
    mode,
    reference: String(
      record.reference || record.orderNumber || entityId.slice(-6) || "—"
    ),
    status,
    statusLabel: String(record.statusLabel || status),
    ui: {
      label: String(ui?.label || record.statusLabel || status),
      color: String(ui?.color || "default"),
      icon: String(ui?.icon || ""),
      badgeText:
        typeof ui?.badgeText === "string" ? ui.badgeText : undefined,
    },
    customer: normalizeCustomer(record),
    context: {
      date:
        (typeof context?.date === "string" ? context.date : null) ||
        (typeof record.date === "string" ? record.date : null),
      window:
        (typeof context?.window === "string" ? context.window : undefined) ||
        (typeof delivery?.deliveryWindow === "string"
          ? delivery.deliveryWindow
          : undefined),
      address: context?.address,
      addressSummary:
        typeof context?.addressSummary === "string"
          ? context.addressSummary
          : null,
      branch:
        typeof context?.branch === "string" ? context.branch : null,
      pickupCode:
        (typeof context?.pickupCode === "string" ? context.pickupCode : null) ||
        (typeof pickup?.pickupCode === "string" ? pickup.pickupCode : null),
      notes:
        (typeof context?.notes === "string" ? context.notes : null) ||
        (typeof record.notes === "string" ? record.notes : null),
      mealCount:
        typeof context?.mealCount === "number" ? context.mealCount : undefined,
      requiredMealCount:
        typeof context?.requiredMealCount === "number"
          ? context.requiredMealCount
          : undefined,
    },
    delivery: delivery
      ? {
        method: typeof delivery.method === "string" ? delivery.method : mode,
        address: delivery.address,
        zone:
          delivery.zone && typeof delivery.zone === "object"
            ? (delivery.zone as { id: string; name: string })
            : null,
        zoneId:
          typeof delivery.zoneId === "string" ? delivery.zoneId : null,
        deliveryWindow:
          typeof delivery.deliveryWindow === "string"
            ? delivery.deliveryWindow
            : undefined,
        pickupLocationId:
          typeof delivery.pickupLocationId === "string"
            ? delivery.pickupLocationId
            : null,
      }
      : undefined,
    pickup: pickup
      ? {
        pickupLocationId:
          typeof pickup.pickupLocationId === "string"
            ? pickup.pickupLocationId
            : null,
        pickupRequested: Boolean(pickup.pickupRequested),
        pickupPreparedAt:
          typeof pickup.pickupPreparedAt === "string"
            ? pickup.pickupPreparedAt
            : null,
        pickupCodeIssuedAt:
          typeof pickup.pickupCodeIssuedAt === "string"
            ? pickup.pickupCodeIssuedAt
            : null,
        pickupVerifiedAt:
          typeof pickup.pickupVerifiedAt === "string"
            ? pickup.pickupVerifiedAt
            : null,
        pickupNoShowAt:
          typeof pickup.pickupNoShowAt === "string"
            ? pickup.pickupNoShowAt
            : null,
        pickupCode:
          typeof pickup.pickupCode === "string" ? pickup.pickupCode : null,
      }
      : undefined,
    items: normalizeLineItems(record.items),
    paymentStatus:
      typeof record.paymentStatus === "string" ? record.paymentStatus : null,
    orderNumber:
      typeof record.orderNumber === "string" ? record.orderNumber : null,
    mealSlots: normalizeMealSlots(record.mealSlots),
    subscriptionDayId:
      typeof record.subscriptionDayId === "string"
        ? record.subscriptionDayId
        : entityType === "subscription_day"
          ? entityId
          : null,
    subscriptionId:
      typeof record.subscriptionId === "string"
        ? record.subscriptionId
        : null,
    allowedActions: normalizeAllowedActions(record.allowedActions),
    notes: typeof record.notes === "string" ? record.notes : null,
    timestamps: {
      createdAt:
        (typeof record.createdAt === "string" ? record.createdAt : null) ||
        null,
      updatedAt:
        (typeof record.updatedAt === "string" ? record.updatedAt : null) ||
        null,
    },
  };
}

export function extractOperationsQueueItems(
  response: DashboardOpsListResponse | unknown
): UnifiedQueueItem[] {
  const payload = asRecord(response);
  if (!payload) return [];

  const nested = asRecord(payload.data);
  const rawItems = Array.isArray(nested?.items)
    ? nested.items
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];

  return rawItems.map(normalizeOperationsQueueItem);
}
