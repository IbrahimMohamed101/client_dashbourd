import type {
  DashboardOpsActionRequest,
  DashboardOpsListResponse,
  DashboardQueueItemV2,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

export const OPERATIONS_SCREENS = ["kitchen", "pickup", "courier"] as const;

export type OperationsScreen = (typeof OPERATIONS_SCREENS)[number];

export interface OperationsScreenConfig {
  label: string;
  screens: OperationsScreen[];
}

type RawQueueRecord = Record<string, unknown>;

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
  cashier: {
    label: "العمليات",
    screens: ALL_OPERATIONS_SCREENS,
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

function asRecord(value: unknown): RawQueueRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawQueueRecord)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function safeText(value: unknown, fallback = "غير محدد"): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || text === "[object Object]") return fallback;
    return text;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "نعم" : "لا";

  const record = asRecord(value);
  if (record) {
    return safeText(
      record.displayName ??
        record.ar ??
        record.en ??
        asRecord(record.name)?.ar ??
        asRecord(record.name)?.en ??
        record.key ??
        record.id,
      fallback
    );
  }

  return fallback;
}

function buildAddressSummary(value: unknown): string | null {
  const address = asRecord(value);
  if (!address) return null;

  const display = asRecord(address.display);
  const displayAddress =
    asString(address.displayAddressAr) ||
    asString(address.displayAddress) ||
    asString(display?.ar) ||
    asString(display?.en);

  if (displayAddress) return displayAddress;

  return [
    address.formattedAddress,
    address.line1,
    address.line2,
    address.label,
    address.district,
    address.street,
    address.building,
    address.apartment,
    address.city,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("، ") || null;
}

function extractAddressNotes(value: unknown): string | null {
  const address = asRecord(value);
  if (!address) return null;

  return (
    asString(address.notes) ||
    asString(asRecord(address.display)?.notes) ||
    null
  );
}

function normalizeSourceType(value: string | null | undefined): UnifiedQueueItem["source"] {
  if (value === "one_time_order" || value === "order") return "one_time_order";
  if (value === "pickup_request" || value === "subscription_pickup_request") {
    return "subscription_pickup_request";
  }
  return "subscription";
}

function normalizeEntityType(value: string | null | undefined): UnifiedQueueItem["entityType"] {
  if (value === "order" || value === "one_time_order") return "order";
  if (value === "pickup_request" || value === "subscription_pickup_request") {
    return "subscription_pickup_request";
  }
  return "subscription_day";
}

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
    entityId: item.ids?.entityId || item.entityId,
    entityType: item.ids?.entityType || item.entityType,
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

export function normalizeOperationsListResponse(
  response: DashboardOpsListResponse
): UnifiedQueueItem[] {
  const rawItems = response?.data?.items ?? [];
  return rawItems.map(normalizeQueueItem);
}

export function normalizeQueueItem(item: DashboardQueueItemV2): UnifiedQueueItem {
  const raw = item as unknown as RawQueueRecord;
  const ids = asRecord(raw.ids);
  const customer = asRecord(raw.customer);
  const plan = asRecord(raw.plan);
  const delivery = asRecord(raw.delivery);
  const pickup = asRecord(raw.pickup);
  const kitchen = asRecord(raw.kitchen);
  const context = asRecord(raw.context);
  const timestamps = asRecord(raw.timestamps);
  const actions = asRecord(raw.actions);
  const state = asRecord(raw.state);

  const entityType = normalizeEntityType(asString(raw.entityType) || asString(ids?.entityType));
  const source = normalizeSourceType(asString(raw.source) || asString(ids?.source));
  const entityId =
    asString(raw.entityId) ||
    asString(ids?.entityId) ||
    asString(ids?.orderId) ||
    asString(ids?.subscriptionDayId) ||
    asString(raw.id) ||
    "";

  const allowedActions = asArray(raw.allowedActions).map((entry) => {
    const action = asRecord(entry) || {};
    return {
      id: safeText(action.id, ""),
      label: safeText(action.label, safeText(action.id, "إجراء")),
      method: safeText(action.method, "POST"),
      endpoint: safeText(action.endpoint, getEndpointForAction(safeText(action.id, ""))),
      color: safeText(action.color, "default"),
      requiresReason: Boolean(action.requiresReason),
      dangerous: Boolean(action.dangerous),
    };
  }).filter((action) => action.id);

  return {
    id: safeText(raw.id, entityId),
    entityId,
    entityType,
    source,
    type: entityType === "order" ? "order" : entityType === "subscription_pickup_request" ? "pickup_request" : "subscription",
    status: safeText(raw.status || state?.status, "unknown"),
    statusLabel: safeText(raw.statusLabel || state?.statusLabel || raw.status, "غير محدد"),
    customer: {
      name: safeText(customer?.name || raw.customerName, "غير محدد"),
      phone: safeText(customer?.phone || raw.customerPhone, ""),
    },
    plan: {
      name: safeText(plan?.name || raw.planName, "غير محدد"),
    },
    delivery: {
      mode: safeText(delivery?.mode || raw.deliveryMode || pickup?.mode, "unknown"),
      address: buildAddressSummary(delivery?.address || raw.address),
      notes: extractAddressNotes(delivery?.address || raw.address),
      zone: safeText(delivery?.zone || raw.zone, ""),
    },
    pickup: {
      branchName: safeText(pickup?.branchName || pickup?.branch || raw.pickupBranch, ""),
      code: safeText(pickup?.code || raw.pickupCode, ""),
    },
    kitchen: {
      meals: asArray(kitchen?.meals || raw.meals),
      addons: asArray(kitchen?.addons || raw.addons),
    },
    context: {
      date: safeText(context?.date || raw.date, ""),
      requiredMealCount: asNumber(context?.requiredMealCount || raw.requiredMealCount) || 0,
      mealCount: asNumber(context?.mealCount || raw.mealCount) || 0,
    },
    timestamps: {
      createdAt: safeText(timestamps?.createdAt || raw.createdAt, ""),
      updatedAt: safeText(timestamps?.updatedAt || raw.updatedAt, ""),
    },
    ids: {
      entityId,
      entityType,
      source,
      orderId: asString(ids?.orderId),
      subscriptionDayId: asString(ids?.subscriptionDayId),
      subscriptionId: asString(ids?.subscriptionId),
    },
    allowedActions,
    actions: {
      allowed: asArray(actions?.allowed),
      canPrepare: asBoolean(actions?.canPrepare) || false,
      canReadyForPickup: asBoolean(actions?.canReadyForPickup) || false,
      canDispatch: asBoolean(actions?.canDispatch) || false,
      canFulfill: asBoolean(actions?.canFulfill) || false,
    },
    raw: item,
  } as UnifiedQueueItem;
}

export function getPickupItems(items: UnifiedQueueItem[]): UnifiedQueueItem[] {
  return items.filter((item) => item.delivery?.mode === "pickup" || item.source === "subscription_pickup_request");
}

export function getCourierItems(items: UnifiedQueueItem[]): UnifiedQueueItem[] {
  return items.filter((item) => item.delivery?.mode === "delivery");
}
