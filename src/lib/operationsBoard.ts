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

type RawQueueRecord = Record<string, unknown>;

function asRecord(value: unknown): RawQueueRecord | null {
  return value && typeof value === "object" ? (value as RawQueueRecord) : null;
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

function buildAddressSummary(value: unknown): string | null {
  const address = asRecord(value);
  if (!address) return null;

  return [
    address.line1,
    address.line2,
    address.district,
    address.street,
    address.building,
    address.apartment,
    address.city,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("، ") || null;
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
      const id = asString(action?.id);
      if (!action || !id) return null;

      return {
        id,
        label: asString(action.label) || id,
        color: asString(action.color) || "default",
        icon: asString(action.icon) || "",
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
    id: asString(source?.id) || asString(raw.userId) || "",
    name: asString(source?.name) || "—",
    phone: asString(source?.phone) || "",
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
    const slotItems = asArray(record.items);

    return {
      slot: String(record.slot || record.slotKey || `slot-${index + 1}`),
      items: slotItems.length
        ? slotItems.map((entry) => {
          const item = asRecord(entry) || {};
          return {
            name: String(item.name || "عنصر"),
            quantity: Number(item.quantity || item.qty || 1),
            notes: asString(item.notes) || undefined,
          };
        })
        : [
          {
            name: String(
              record.productName ||
              record.proteinName ||
              record.sandwichId ||
              record.operationalSku ||
              record.selectionType ||
              "وجبة"
            ),
            quantity: Number(record.quantity || 1),
            notes: asString(record.notes) || undefined,
          },
        ],
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
      notes: asString(item.notes) || undefined,
    };
  });
}

function normalizePlan(raw: unknown): UnifiedQueueItem["plan"] {
  const plan = asRecord(raw);
  if (!plan) return null;

  return {
    id: asString(plan.id),
    key: asString(plan.key),
    name: asString(plan.name),
    daysCount: asNumber(plan.daysCount),
    durationDays: asNumber(plan.durationDays),
    totalMeals: asNumber(plan.totalMeals),
    remainingMeals: asNumber(plan.remainingMeals),
    selectedMealsPerDay: asNumber(plan.selectedMealsPerDay),
    deliveryMode: asString(plan.deliveryMode),
    proteinGrams: asNumber(plan.proteinGrams),
    portionSize: asString(plan.portionSize),
  };
}

function normalizeKitchenDetails(raw: unknown): UnifiedQueueItem["kitchenDetails"] {
  const details = asRecord(raw);
  if (!details) return null;

  return {
    ...details,
    mealSlots: asArray(details.mealSlots),
    addons: asArray(details.addons),
  };
}

function normalizePaymentValidity(raw: unknown): UnifiedQueueItem["paymentValidity"] {
  const payment = asRecord(raw);
  if (!payment) return null;

  return {
    paymentRequired: asBoolean(payment.paymentRequired),
    paymentStatus: asString(payment.paymentStatus),
    paymentApplied: asBoolean(payment.paymentApplied),
    pendingUnpaid: asBoolean(payment.pendingUnpaid),
    superseded: asBoolean(payment.superseded),
    revisionMismatch: asBoolean(payment.revisionMismatch),
    canPrepare: asBoolean(payment.canPrepare),
    canFulfill: asBoolean(payment.canFulfill),
    reason: asString(payment.reason),
  };
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
  const addressSummary =
    asString(context?.addressSummary) ||
    asString(delivery?.addressSummary) ||
    buildAddressSummary(delivery?.address) ||
    buildAddressSummary(context?.address);
  const plan = normalizePlan(record.plan);
  const paymentValidity = normalizePaymentValidity(record.paymentValidity);

  return {
    id: String(record.id || entityId),
    entityId,
    entityType,
    source,
    type: (record.type || entityType) as UnifiedQueueItem["type"],
    mode,
    reference: String(record.reference || record.orderNumber || entityId.slice(-6) || "—"),
    status,
    statusLabel: String(record.statusLabel || status),
    ui: {
      label: String(ui?.label || record.statusLabel || status),
      color: String(ui?.color || "default"),
      icon: String(ui?.icon || ""),
      badgeText: asString(ui?.badgeText) || undefined,
    },
    customer: normalizeCustomer(record),
    context: {
      date: asString(context?.date) || asString(record.date),
      window:
        asString(context?.window) ||
        asString(delivery?.window) ||
        asString(delivery?.deliveryWindow) ||
        undefined,
      address: context?.address || delivery?.address,
      addressSummary,
      branch: asString(context?.branch) || asString(pickup?.branchId),
      pickupCode: asString(context?.pickupCode) || asString(pickup?.pickupCode),
      notes: asString(context?.notes) || asString(record.notes),
      mealCount: asNumber(context?.mealCount) ?? asNumber(pickup?.mealCount) ?? undefined,
      requiredMealCount:
        asNumber(context?.requiredMealCount) ??
        asNumber(plan?.selectedMealsPerDay) ??
        undefined,
    },
    delivery: delivery
      ? {
        deliveryId: asString(delivery.deliveryId),
        method: asString(delivery.method) || mode,
        date: asString(delivery.date),
        status: asString(delivery.status),
        address: delivery.address,
        addressSummary,
        zone:
          delivery.zone && typeof delivery.zone === "object"
            ? (delivery.zone as { id: string; name: string })
            : null,
        zoneId: asString(delivery.zoneId),
        courierId: asString(delivery.courierId),
        window: asString(delivery.window),
        deliveryWindow: asString(delivery.deliveryWindow) || undefined,
        pickupLocationId: asString(delivery.pickupLocationId),
      }
      : undefined,
    pickup: pickup
      ? {
        pickupRequestId: asString(pickup.pickupRequestId),
        branchId: asString(pickup.branchId),
        locationId: asString(pickup.locationId),
        pickupLocationId: asString(pickup.pickupLocationId),
        pickupRequested: Boolean(pickup.pickupRequested),
        pickupPreparedAt: asString(pickup.pickupPreparedAt),
        pickupCodeIssuedAt: asString(pickup.pickupCodeIssuedAt),
        pickupVerifiedAt: asString(pickup.pickupVerifiedAt),
        pickupNoShowAt: asString(pickup.pickupNoShowAt),
        pickupCode: asString(pickup.pickupCode),
        pickupCodeState: asString(pickup.pickupCodeState),
        mealCount: asNumber(pickup.mealCount),
        remainingMeals: asNumber(pickup.remainingMeals),
        reserved: asBoolean(pickup.reserved),
        consumed: asBoolean(pickup.consumed),
        released: asBoolean(pickup.released),
      }
      : undefined,
    items: normalizeLineItems(record.items),
    pricing: record.pricing,
    paymentStatus: asString(record.paymentStatus) || paymentValidity?.paymentStatus || null,
    orderNumber: asString(record.orderNumber),
    mealSlots: normalizeMealSlots(record.mealSlots),
    materializedMeals: asArray(record.materializedMeals),
    addonSelections: asArray(record.addonSelections),
    premiumUpgradeSelections: asArray(record.premiumUpgradeSelections),
    fulfillmentType: asString(record.fulfillmentType),
    plan,
    kitchenDetails: normalizeKitchenDetails(record.kitchenDetails),
    paymentValidity,
    subscriptionDayId:
      asString(record.subscriptionDayId) ||
      (entityType === "subscription_day" ? entityId : null),
    subscriptionId: asString(record.subscriptionId),
    allowedActions: normalizeAllowedActions(record.allowedActions),
    notes: asString(record.notes),
    timestamps: {
      createdAt: asString(record.createdAt),
      updatedAt: asString(record.updatedAt),
    },
    rawData: record,
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
      : Array.isArray(response)
        ? response
        : [];

  return rawItems.map(normalizeOperationsQueueItem);
}
