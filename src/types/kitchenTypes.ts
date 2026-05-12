// ── Tab identifiers ──
export type KitchenOperationsTab =
  | "daily_subscriptions"
  | "individual_orders"
  | "branch_pickup";

// ── Status values returned by the backend ──
export type KitchenUiStatus =
  | "open"
  | "locked"
  | "confirmed"
  | "in_preparation"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "fulfilled"
  | "not_prepared"
  | "no_show"
  | "pending_payment"
  | "cancelled"
  | "expired";

export type KitchenOperationsMode = "pickup" | "delivery";

// ── Summary endpoint ──
export interface KitchenSummaryData {
  subscriptionsToday: number;
  lockedDays: number;
  inPreparation: number;
  readyForPickup: number;
  outForDelivery: number;
  individualOrders: number;
  receivedToday: number;
  notPrepared: number;
}

export interface KitchenTabsCounts {
  subscriptionsDaily: number;
  individualOrders: number;
  branchPickup: number;
}

export interface KitchenSubscriptionFilters {
  all: number;
  delivery: number;
  pickup: number;
  received: number;
  open: number;
  locked: number;
  in_preparation: number;
  ready_for_pickup: number;
  out_for_delivery: number;
  not_prepared: number;
}

export interface KitchenOperationsSummaryResponse {
  status: boolean;
  data: {
    date: string;
    summary: KitchenSummaryData;
    tabs: KitchenTabsCounts;
    subscriptionFilters: KitchenSubscriptionFilters;
  };
}

// ── List endpoint – Row DTO ──
export interface KitchenRowCustomer {
  id: string | null;
  name: string;
  avatar: string | null;
}

export interface KitchenRowTimeWindow {
  from: string | null;
  to: string | null;
  label: string;
}

export interface KitchenRowItem {
  id: string;
  name: string;
  kind: string; // "meal" | "premium" | etc.
}

export interface KitchenProgressStep {
  key: string;
  done: boolean;
}

export interface KitchenRowProgress {
  step: number;
  totalSteps: number;
  steps: KitchenProgressStep[];
}

export interface KitchenRowAction {
  key: string;
  label: string;
  method: string;
  endpoint: string;
  enabled: boolean;
  variant: string; // "primary" | "secondary" | "danger"
  confirm: boolean;
  requiresConfirmation: boolean;
  confirmationMessage: string | null;
}

export interface KitchenRowBadges {
  locked: boolean;
  assignedByKitchen: boolean;
  pickupRequested: boolean;
}

export interface KitchenRowMeta {
  subscriptionId: string | null;
  orderId: string | null;
  dayId: string | null;
}

export interface KitchenOperationsRow {
  id: string;
  entityType: string; // "subscription_day" | "order" | "pickup"
  source?: "subscription" | "one_time_order";
  reference: string;
  customer: KitchenRowCustomer;
  date: string;
  mode: KitchenOperationsMode;
  modeLabel: string;
  timeWindow: KitchenRowTimeWindow;
  items: KitchenRowItem[];
  status: KitchenUiStatus;
  statusLabel: string;
  progress: KitchenRowProgress;
  actions: KitchenRowAction[];
  badges: KitchenRowBadges;
  verification: unknown;
  ui: { layout: string };
  timing: {
    createdAt: string;
    createdAtLabel: string;
  };
  meta: KitchenRowMeta;
  paymentStatus?: string;
  fulfillmentMethod?: "pickup" | "delivery";
}

export interface KitchenOperationsListResponse {
  status: boolean;
  data: {
    rows: KitchenOperationsRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    appliedFilters: {
      status: string | null;
      mode: string;
      search: string | null;
      branchId: string | null;
      kitchenId: string | null;
      sortBy: string;
      sortOrder: string;
    };
  };
}

// ── Bulk lock response ──
export interface BulkLockResponse {
  status: boolean;
  data: {
    date: string;
    totalDays: number;
    lockedCount: number;
    skippedCount: number;
    alreadyProcessedCount: number;
    missingSubscriptionCount: number;
  };
}
