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
  const actionsRecord = asRecord(raw);
  const sourceActions = actionsRecord
    ? actionsRecord.items || actionsRecord.allowedActions || actionsRecord.allowed
    : raw;

  if (!Array.isArray(sourceActions)) return [];

  return sourceActions
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
        label: safeText(action.label, id),
        color: asString(action.color) || "default",
        icon: asString(action.icon) || "",
        endpoint: asString(action.endpoint) || undefined,
        method: asString(action.method) || undefined,
        reason: asString(action.reason) || undefined,
        reasonLabel: asRecord(action.reasonLabel) as never,
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
    name: safeText(source?.name, "غير محدد"),
    phone: asString(source?.phone) || "",
  };
}

function normalizeMode(raw: RawQueueRecord): UnifiedQueueItem["mode"] {
  const fulfillment = asRecord(raw.fulfillment);
  const candidate = String(
    raw.mode ||
    raw.deliveryMethod ||
    raw.deliveryMode ||
    fulfillment?.type ||
    "delivery"
  );
  return candidate.includes("pickup") ? "pickup" : "delivery";
}

function normalizePlan(raw: unknown): UnifiedQueueItem["plan"] {
  const plan = asRecord(raw);
  if (!plan) return null;

  return {
    id: asString(plan.id),
    key: asString(plan.key),
    name: safeText(plan.displayName ?? plan.name, "غير محدد"),
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

function normalizePayment(raw: unknown): UnifiedQueueItem["paymentValidity"] {
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
            name: safeText(item.displayName ?? item.name, "عنصر"),
            quantity: Number(item.quantity || item.qty || 1),
            notes: asString(item.notes) || undefined,
          };
        })
        : [
          {
            name: safeText(
              asRecord(record.display)?.titleAr ||
                asRecord(record.product)?.displayName ||
                asRecord(record.sandwich)?.displayName ||
                asRecord(record.product)?.name ||
                asRecord(record.protein)?.displayName ||
                asRecord(record.protein)?.name ||
                record.productName ||
                record.proteinName ||
                record.sandwichId ||
                record.selectionType,
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
      name: safeText(item.displayName ?? item.name, "عنصر"),
      quantity: Number(item.quantity || item.qty || 1),
      notes: asString(item.notes) || undefined,
    };
  });
}

export function normalizeOperationsQueueItem(
  raw: unknown,
  contractVersion?: string
): UnifiedQueueItem {
  const record = asRecord(raw) || {};
  const ids = asRecord(record.ids);
  const sourceInfo = asRecord(record.source);
  const subscription = asRecord(record.subscription);
  const orderSummary = asRecord(record.orderSummary);
  const kitchen = asRecord(record.kitchen);
  const fulfillment = asRecord(record.fulfillment);
  const delivery = asRecord(record.delivery) || asRecord(fulfillment?.delivery);
  const pickup = asRecord(record.pickup) || asRecord(fulfillment?.pickup);
  const context = asRecord(record.context);
  const timestamps = asRecord(record.timestamps);
  const ui = asRecord(record.ui);

  const sourceType = asString(sourceInfo?.type) || asString(record.source);
  const entityType = normalizeEntityType(
    asString(ids?.entityType) || asString(record.entityType) || sourceType || asString(record.type)
  );
  const source = normalizeSourceType(sourceType || entityType);
  const entityId = String(
    ids?.entityId ||
    record.entityId ||
    record.id ||
    ids?.subscriptionDayId ||
    record.subscriptionDayId ||
    ids?.orderId ||
    record.orderId ||
    ""
  );
  const mode = normalizeMode(record);
  const status = String(sourceInfo?.status || record.status || "open");
  const plan = normalizePlan(asRecord(subscription?.plan) || record.plan);
  const paymentValidity = normalizePayment(record.payment || record.paymentValidity);
  const addressSummary =
    asString(context?.addressSummary) ||
    asString(delivery?.addressSummary) ||
    buildAddressSummary(delivery?.address) ||
    buildAddressSummary(context?.address);

  return {
    contractVersion,
    ids: ids as UnifiedQueueItem["ids"],
    id: String(record.id || entityId),
    entityId,
    entityType,
    source,
    type: (entityType === "order" ? "order" : source) as UnifiedQueueItem["type"],
    mode,
    reference: safeText(sourceInfo?.reference || record.reference || record.orderNumber || entityId.slice(-6), "—"),
    status,
    statusLabel: safeText(asRecord(sourceInfo?.statusLabel)?.ar || record.statusLabel || status, status),
    ui: {
      label: safeText(ui?.label || asRecord(sourceInfo?.statusLabel)?.ar || record.statusLabel || status, status),
      color: String(ui?.color || "default"),
      icon: String(ui?.icon || ""),
      badgeText: asString(ui?.badgeText) || undefined,
    },
    customer: normalizeCustomer(record),
    context: {
      date: asString(sourceInfo?.date) || asString(context?.date) || asString(record.date),
      window:
        asString(context?.window) ||
        asString(delivery?.window) ||
        asString(delivery?.deliveryWindow) ||
        undefined,
      address: context?.address || delivery?.address,
      addressSummary,
      branch: asString(context?.branch) || asString(pickup?.branchId) || asString(pickup?.locationId),
      pickupCode: asString(context?.pickupCode) || asString(pickup?.pickupCode),
      notes: asString(context?.notes) || asString(orderSummary?.notes) || asString(record.notes),
      mealCount:
        asNumber(orderSummary?.mealCount) ??
        asNumber(context?.mealCount) ??
        asNumber(pickup?.mealCount) ??
        undefined,
      requiredMealCount:
        asNumber(context?.requiredMealCount) ??
        asNumber(plan?.selectedMealsPerDay) ??
        undefined,
    },
    delivery: delivery
      ? {
        deliveryId: asString(delivery.deliveryId) || asString(ids?.deliveryId),
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
        pickupRequestId: asString(pickup.pickupRequestId) || asString(ids?.pickupRequestId),
        branchId: asString(pickup.branchId),
        locationId: asString(pickup.locationId),
        pickupLocationId: asString(pickup.pickupLocationId),
        pickupRequested: Boolean(pickup.pickupRequested || mode === "pickup"),
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
    mealSlots: normalizeMealSlots(kitchen?.meals),
    addonSelections: asArray(record.addonSelections),
    premiumUpgradeSelections: asArray(record.premiumUpgradeSelections),
    fulfillmentType: asString(fulfillment?.type) || asString(record.fulfillmentType),
    plan,
    orderSummary: orderSummary as UnifiedQueueItem["orderSummary"],
    kitchen: kitchen
      ? {
        meals: asArray(kitchen.meals) as DashboardQueueItemV2["kitchen"]["meals"],
        addons: asArray(kitchen.addons) as DashboardQueueItemV2["kitchen"]["addons"],
      }
      : undefined,
    fulfillment: fulfillment
      ? (fulfillment as DashboardQueueItemV2["fulfillment"])
      : undefined,
    payment: asRecord(record.payment)
      ? (record.payment as DashboardQueueItemV2["payment"])
      : undefined,
    actions: asRecord(record.actions)
      ? (record.actions as DashboardQueueItemV2["actions"])
      : undefined,
    dataQuality: asRecord(record.dataQuality)
      ? (record.dataQuality as DashboardQueueItemV2["dataQuality"])
      : undefined,
    kitchenDetails: kitchen
      ? {
        mealSlots: asArray(kitchen.meals),
        addons: asArray(kitchen.addons),
      }
      : asRecord(record.kitchenDetails)
        ? {
          ...asRecord(record.kitchenDetails),
          mealSlots: asArray(asRecord(record.kitchenDetails)?.mealSlots),
          addons: asArray(asRecord(record.kitchenDetails)?.addons),
        }
        : null,
    paymentValidity,
    subscriptionDayId:
      asString(ids?.subscriptionDayId) ||
      asString(record.subscriptionDayId) ||
      (entityType === "subscription_day" ? entityId : null),
    subscriptionId:
      asString(ids?.subscriptionId) ||
      asString(subscription?.id) ||
      asString(record.subscriptionId),
    allowedActions: normalizeAllowedActions(record.actions || record.allowedActions),
    notes: asString(orderSummary?.notes) || asString(record.notes),
    timestamps: {
      createdAt: asString(timestamps?.createdAt) || asString(record.createdAt),
      updatedAt: asString(timestamps?.updatedAt) || asString(record.updatedAt),
      preparedAt: asString(timestamps?.preparedAt),
      fulfilledAt: asString(timestamps?.fulfilledAt),
    },
  };
}

export function extractOperationsQueueItems(
  response: DashboardOpsListResponse | unknown
): UnifiedQueueItem[] {
  const payload = asRecord(response);
  if (!payload) return [];

  const nested = asRecord(payload.data);
  const contractVersion = asString(nested?.contractVersion);
  const rawItems = Array.isArray(nested?.items)
    ? nested.items
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(response)
        ? response
        : [];

  return rawItems.map((item) => normalizeOperationsQueueItem(item, contractVersion || undefined));
}
