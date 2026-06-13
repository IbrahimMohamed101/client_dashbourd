export interface LocalizedText {
  ar?: string;
  en?: string;
}

export interface DisplayEntity {
  id?: string | null;
  key?: string | null;
  name?: LocalizedText;
  displayName: string;
}

export interface KitchenMealV2 {
  slotIndex?: number;
  slotKey?: string;
  mealType: string;
  mealTypeLabel?: LocalizedText;
  product?: DisplayEntity;
  sandwich?: DisplayEntity | null;
  protein?: DisplayEntity & { grams?: number | null };
  carbs?: Array<DisplayEntity & { grams?: number | null }>;
  salad?: DisplayEntity | null;
  sauce?: DisplayEntity[];
  sides?: DisplayEntity[];
  options?: DisplayEntity[];
  premium?: {
    isPremium: boolean;
    key?: string | null;
    source?: string | null;
    labelAr?: string | null;
  };
  quantity: number;
  notes?: string | null;
  display?: {
    titleAr?: string;
    subtitleAr?: string;
    preparationTextAr?: string;
    badgesAr?: string[];
  };
}

export interface KitchenAddonV2 extends DisplayEntity {
  quantity: number;
  display?: {
    titleAr?: string;
  };
}

export interface QueueAction {
  id: string;
  label: string;
  color?: string;
  icon?: string;
  endpoint?: string;
  method?: string;
  requiresReason?: boolean;
  reason?: string | null;
  reasonLabel?: LocalizedText | null;
}

export interface DataQualityWarning {
  code: string;
  field?: string;
  messageAr?: string;
  messageEn?: string;
}

export interface DashboardQueueItemV2 {
  ids: {
    entityType: string;
    entityId: string;
    subscriptionId?: string | null;
    subscriptionDayId?: string | null;
    orderId?: string | null;
    deliveryId?: string | null;
    pickupRequestId?: string | null;
  };
  customer: {
    id?: string | null;
    name: string;
    phone?: string;
  };
  source: {
    type: string;
    reference: string;
    date: string;
    status: string;
    statusLabel?: LocalizedText;
    lifecycleGroup?: string;
    isActionable?: boolean;
  };
  subscription?: {
    id?: string | null;
    plan?: {
      id?: string | null;
      key?: string | null;
      name?: LocalizedText;
      displayName?: string;
      proteinGrams?: number | null;
      portionSize?: string | null;
      selectedMealsPerDay?: number | null;
      totalMeals?: number;
      remainingMeals?: number;
      deliveryMode?: string;
    };
  };
  orderSummary: {
    mealCount: number;
    addonCount?: number;
    itemCount: number;
    mealCountTextAr?: string;
    addonCountTextAr?: string;
    itemCountTextAr?: string;
    hasPremium: boolean;
    hasAddons: boolean;
    notes?: string | null;
    allergies?: string | null;
    display?: {
      titleAr?: string;
      subtitleAr?: string;
      fulfillmentTextAr?: string;
    };
  };
  kitchen: {
    meals: KitchenMealV2[];
    addons: KitchenAddonV2[];
  };
  fulfillment: {
    type: string;
    typeLabel?: LocalizedText;
    delivery?: Record<string, unknown> | null;
    pickup?: Record<string, unknown> | null;
  };
  payment: {
    paymentRequired: boolean;
    paymentStatus: string;
    paymentStatusLabel?: LocalizedText;
    paymentApplied: boolean;
    pendingUnpaid: boolean;
    superseded: boolean;
    revisionMismatch: boolean;
    canPrepare: boolean;
    canFulfill: boolean;
    reason?: string | null;
    reasonLabel?: LocalizedText | null;
  };
  actions: {
    allowed: QueueAction[];
    disabled?: QueueAction[];
    canPrepare: boolean;
    canDispatch: boolean;
    canReadyForPickup: boolean;
    canFulfill: boolean;
    canCancel: boolean;
    canNoShow: boolean;
    canReopen: boolean;
  };
  timestamps?: {
    createdAt?: string | null;
    updatedAt?: string | null;
    preparedAt?: string | null;
    fulfilledAt?: string | null;
  };
  dataQuality?: {
    isComplete: boolean;
    warnings: DataQualityWarning[];
  };
}

export interface DashboardQueueV2Response {
  status: boolean;
  data: {
    contractVersion: string;
    date: string;
    businessDate: string;
    count: number;
    items: DashboardQueueItemV2[];
    filters?: unknown;
  };
}

export interface UnifiedQueueItem {
  contractVersion?: string;
  ids?: DashboardQueueItemV2["ids"];
  // ── Identity ──
  id: string;
  entityId: string;
  entityType: "subscription_day" | "order" | "subscription_pickup_request";
  source: "subscription" | "one_time_order" | "subscription_pickup_request";
  type: "subscription" | "order" | "subscription_pickup_request";

  // ── Display ──
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  statusLabel: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };

  // ── Customer ──
  customer: {
    id: string;
    name: string;
    phone: string;
  };

  // ── Context ──
  context: {
    date: string | null;
    window?: string;
    address?: unknown;
    addressSummary?: string | null;
    branch?: string | null;
    pickupCode?: string | null;
    notes?: string | null;
    mealCount?: number;
    requiredMealCount?: number;
  };

  // ── Delivery / Pickup details ──
  delivery?: {
    deliveryId?: string | null;
    method?: string;
    date?: string | null;
    status?: string | null;
    address?: unknown;
    addressSummary?: string | null;
    zone?: { id: string; name: string } | null;
    zoneId?: string | null;
    courierId?: string | null;
    window?: string | null;
    deliveryWindow?: string;
    pickupLocationId?: string | null;
  };
  pickup?: {
    pickupRequestId?: string | null;
    branchId?: string | null;
    locationId?: string | null;
    pickupLocationId?: string | null;
    pickupRequested?: boolean;
    pickupPreparedAt?: string | null;
    pickupCodeIssuedAt?: string | null;
    pickupVerifiedAt?: string | null;
    pickupNoShowAt?: string | null;
    pickupCode?: string | null;
    pickupCodeState?: string | null;
    mealCount?: number | null;
    remainingMeals?: number | null;
    reserved?: boolean | null;
    consumed?: boolean | null;
    released?: boolean | null;
  };

  // ── Items (orders) ──
  items?: { id: string; name: string; quantity: number; notes?: string }[];
  pricing?: unknown;
  paymentStatus?: string | null;
  orderNumber?: string | null;

  // ── Subscription-specific ──
  mealSlots?: { slot: string; items: { name: string; quantity: number; notes?: string }[] }[];
  materializedMeals?: unknown[];
  addonSelections?: unknown[];
  premiumUpgradeSelections?: unknown[];
  fulfillmentType?: string | null;
  plan?: {
    id?: string | null;
    key?: string | null;
    name?: string | null;
    daysCount?: number | null;
    durationDays?: number | null;
    totalMeals?: number | null;
    remainingMeals?: number | null;
    selectedMealsPerDay?: number | null;
    deliveryMode?: string | null;
    proteinGrams?: number | null;
    portionSize?: string | null;
  } | null;
  orderSummary?: DashboardQueueItemV2["orderSummary"];
  kitchen?: DashboardQueueItemV2["kitchen"];
  fulfillment?: DashboardQueueItemV2["fulfillment"];
  payment?: DashboardQueueItemV2["payment"];
  actions?: DashboardQueueItemV2["actions"];
  dataQuality?: DashboardQueueItemV2["dataQuality"];
  kitchenDetails?: {
    mealSlots?: unknown[];
    addons?: unknown[];
    [key: string]: unknown;
  } | null;
  paymentValidity?: {
    paymentRequired?: boolean | null;
    paymentStatus?: string | null;
    paymentApplied?: boolean | null;
    pendingUnpaid?: boolean | null;
    superseded?: boolean | null;
    revisionMismatch?: boolean | null;
    canPrepare?: boolean | null;
    canFulfill?: boolean | null;
    reason?: string | null;
  } | null;
  subscriptionDayId?: string | null;
  subscriptionId?: string | null;

  // ── Actions ──
  allowedActions: {
    id: string;
    label: string;
    color: string;
    icon: string;
    endpoint?: string;
    method?: string;
    reason?: string | null;
    reasonLabel?: LocalizedText | null;
    requiresReason: boolean;
  }[];

  // ── Metadata ──
  notes?: string | null;
  timestamps: {
    createdAt: string | null;
    updatedAt: string | null;
    preparedAt?: string | null;
    fulfilledAt?: string | null;
  };
  rawData?: unknown;
}

export interface UnifiedOperationalDTO {
  id: string;
  type: "subscription" | "order" | "subscription_pickup_request";
  source?: "subscription" | "one_time_order" | "subscription_pickup_request";
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };
  customer: { name: string; phone: string };
  context: {
    date: string | null;
    window?: string;
    addressSummary?: string | null;
    pickupCode?: string | null;
    notes?: string | null;
    cancelInfo?: { reason: string; note?: string };
    orderDetails?: string;
  };
  allowedActions: {
    id: string;
    label: string;
    color: string;
    icon: string;
    requiresReason: boolean;
  }[];
  timestamps: { createdAt: string | null; updatedAt: string | null };
}

export const isOneTimeOrder = (item: { source?: string; entityType?: string }): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};

export const isSubscriptionDay = (item: { source?: string; entityType?: string }): boolean => {
  return item.entityType === "subscription_day" || item.source === "subscription";
};

export const isPickupRequest = (item: { source?: string; entityType?: string }): boolean => {
  return item.entityType === "subscription_pickup_request" || item.source === "subscription_pickup_request";
};

// ── API response wrappers ──

export interface DashboardOpsListResponse {
  status: boolean;
  data?: {
    contractVersion?: string;
    date: string;
    items: UnifiedQueueItem[];
    filters?: {
      status: string[];
      method: string;
      q: string | null;
      zoneId: string | null;
      branchId: string | null;
    };
  };
  items?: UnifiedQueueItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardOpsActionRequest {
  entityId: string;
  entityType: string;
  source?: string;
  action: string;
  reason?: string;
  note?: string;
  payload?: {
    reason?: string;
    pickupCode?: string;
    notes?: string;
  };
}

export interface DashboardOpsActionResponse {
  status: boolean;
  data: UnifiedQueueItem;
}

// ── Filter types ──

export type DashboardOpsStatusFilter =
  | "all"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "canceled"
  | "confirmed"
  | "in_preparation"
  | "ready_for_pickup"
  | "fulfilled"
  | "expired"
  | "pending_payment";

// ── Status grouping helpers ──
// Centralised status-matching so every component uses the same logic.

const DELIVERED_STATUSES = ["delivered", "fulfilled"];
const CANCELED_STATUSES = ["canceled", "cancelled", "delivery_canceled"];
const PREPARING_STATUSES = ["preparing", "in_preparation"];

export function matchesStatusFilter(
  itemStatus: string,
  filter: DashboardOpsStatusFilter
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "preparing":
      return PREPARING_STATUSES.includes(itemStatus);
    case "out_for_delivery":
      return itemStatus === "out_for_delivery";
    case "delivered":
      return DELIVERED_STATUSES.includes(itemStatus);
    case "canceled":
      return CANCELED_STATUSES.includes(itemStatus);
    case "confirmed":
      return itemStatus === "confirmed";
    case "in_preparation":
      return itemStatus === "in_preparation";
    case "ready_for_pickup":
      return itemStatus === "ready_for_pickup";
    case "fulfilled":
      return itemStatus === "fulfilled";
    case "expired":
      return itemStatus === "expired";
    case "pending_payment":
      return itemStatus === "pending_payment";
    default:
      return false;
  }
}

export function countByFilter(
  items: { status: string }[],
  filter: DashboardOpsStatusFilter
): number {
  if (filter === "all") return items.length;
  return items.filter((i) => matchesStatusFilter(i.status, filter)).length;
}

// ── Badge color helper ──

export type BadgeColorKey = "green" | "red" | "blue" | "orange" | "yellow";

export const BADGE_CLASSES: Record<BadgeColorKey, string> = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
};

export function getBadgeClasses(color: string): string {
  return BADGE_CLASSES[color as BadgeColorKey] || BADGE_CLASSES.blue;
}
