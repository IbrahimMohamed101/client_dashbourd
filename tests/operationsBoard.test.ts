import assert from "node:assert/strict";
import {
  buildOperationsActionPayload,
  getCourierItems,
  getEndpointForAction,
  getItemsByStatuses,
  getPickupItems,
  getSafeOperationsTab,
  getScreensForRole,
} from "../src/lib/operationsBoard";
import type { UnifiedQueueItem } from "../src/types/dashboardOpsTypes";

const makeItem = (
  overrides: Partial<UnifiedQueueItem>
): UnifiedQueueItem =>
  ({
    id: overrides.entityId,
    entityId: overrides.entityId,
    entityType: "order",
    source: "one_time_order",
    type: "order",
    mode: "pickup",
    reference: overrides.entityId,
    status: "ready",
    statusLabel: "Ready",
    ui: { label: "Ready", color: "blue", icon: "store" },
    customer: { id: "customer-1", name: "Customer", phone: "123" },
    context: { date: null },
    allowedActions: [],
    timestamps: { createdAt: null, updatedAt: null },
    ...overrides,
  }) as UnifiedQueueItem;

assert.deepEqual(getScreensForRole("kitchen").screens, ["kitchen", "pickup"]);
assert.deepEqual(getScreensForRole("courier").screens, ["courier"]);
assert.deepEqual(getScreensForRole("cashier").screens, []);
assert.equal(
  getSafeOperationsTab("pickup", ["kitchen", "pickup", "courier"]),
  "pickup"
);
assert.equal(
  getSafeOperationsTab("courier", ["kitchen", "pickup"]),
  "kitchen"
);
assert.equal(getSafeOperationsTab(undefined, ["courier"]), "courier");
assert.equal(getSafeOperationsTab(undefined, []), "kitchen");

const items = [
  makeItem({ entityId: "ready-pickup", status: "ready", mode: "pickup" }),
  makeItem({
    entityId: "delivery-order",
    status: "out_for_delivery",
    mode: "delivery",
  }),
  makeItem({
    entityId: "subscription-pickup-request",
    source: "subscription_pickup_request",
    entityType: "subscription_pickup_request",
    type: "subscription_pickup_request",
    mode: "pickup",
  }),
];

assert.deepEqual(
  getItemsByStatuses(items, ["ready"]).map((item) => item.entityId),
  ["ready-pickup", "subscription-pickup-request"]
);

assert.deepEqual(
  getPickupItems(items).map((item) => item.entityId),
  ["ready-pickup", "subscription-pickup-request"]
);

assert.deepEqual(
  getCourierItems(items).map((item) => item.entityId),
  ["delivery-order"]
);

assert.equal(
  getEndpointForAction("fulfill"),
  "/api/dashboard/ops/actions/fulfill"
);

assert.deepEqual(
  buildOperationsActionPayload(items[0], "fulfill", undefined, "note", "1111"),
  {
    entityId: "ready-pickup",
    entityType: "order",
    source: "one_time_order",
    action: "fulfill",
    reason: undefined,
    note: "note",
    payload: {
      reason: undefined,
      notes: "note",
      pickupCode: "1111",
    },
  }
);
