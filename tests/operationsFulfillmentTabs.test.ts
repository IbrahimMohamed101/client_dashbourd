import assert from "node:assert/strict";
import { test } from "vitest";
import { partitionOperationsFulfillmentTabs } from "../src/lib/operationsFulfillmentTabs";
import type { UnifiedQueueItem } from "../src/types/dashboardOpsTypes";

function makeItem(
  id: string,
  mode: "pickup" | "delivery"
): UnifiedQueueItem {
  return {
    id,
    entityId: id,
    entityType: "subscription_day",
    source: "subscription",
    type: "subscription",
    mode,
    reference: id,
    status: "open",
    statusLabel: "مفتوح",
    ui: { label: "مفتوح", color: "blue", icon: "clock" },
    customer: { id: "customer-1", name: "عميل", phone: "+966500000000" },
    fulfillment: {
      mode,
      type: mode === "pickup" ? "branch_pickup" : "home_delivery",
    },
    kitchen: {
      version: "v2",
      mealCount: 1,
      cards: [],
      addonGroups: [],
      warnings: [],
    },
    context: { date: "2026-07-26" },
    allowedActions: [
      {
        id: "prepare",
        label: "بدء التحضير",
        color: "orange",
        icon: "chef-hat",
        endpoint: "/api/dashboard/ops/actions/prepare",
        method: "POST",
        requiresReason: false,
      },
    ],
    timestamps: {
      createdAt: "2026-07-25T14:26:21.963Z",
      updatedAt: "2026-07-25T14:26:52.098Z",
    },
  } as UnifiedQueueItem;
}

test("delivery and pickup tabs keep orders visible while kitchen preparation is active", () => {
  const delivery = makeItem("SUB-230041", "delivery");
  const pickup = makeItem("SUB-B637C9", "pickup");

  const tabs = partitionOperationsFulfillmentTabs([delivery, pickup]);

  assert.deepEqual(
    tabs.courier.map((item) => item.id),
    ["SUB-230041"]
  );
  assert.deepEqual(
    tabs.pickup.map((item) => item.id),
    ["SUB-B637C9"]
  );

  assert.equal(tabs.courier.some((item) => item.mode !== "delivery"), false);
  assert.equal(tabs.pickup.some((item) => item.mode !== "pickup"), false);
});
