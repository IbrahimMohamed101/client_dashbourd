import assert from "node:assert/strict";
import {
  getOneTimeOrderRowActions,
} from "../src/lib/oneTimeOrderActions";
import type { OneTimeOrderListItem } from "../src/types/oneTimeOrderTypes";

const makeOrder = (
  overrides: Partial<OneTimeOrderListItem>
): OneTimeOrderListItem =>
  ({
    source: "one_time_order",
    entityType: "order",
    entityId: "order-1",
    orderId: "order-1",
    orderNumber: "ORD-1",
    status: "confirmed",
    paymentStatus: "paid",
    fulfillmentMethod: "pickup",
    customer: { id: "customer-1", name: "Customer", phone: "123" },
    items: [],
    pricing: { totalHalala: 1000, currency: "SAR", vatIncluded: true },
    allowedActions: [],
    ...overrides,
  }) as OneTimeOrderListItem;

assert.deepEqual(
  getOneTimeOrderRowActions(makeOrder({ status: "confirmed" })),
  ["prepare", "cancel"]
);

assert.deepEqual(
  getOneTimeOrderRowActions(makeOrder({ status: "in_preparation" })),
  ["ready_for_pickup", "cancel"]
);

assert.deepEqual(
  getOneTimeOrderRowActions(makeOrder({ status: "ready_for_pickup" })),
  ["fulfill", "cancel"]
);

assert.deepEqual(
  getOneTimeOrderRowActions(
    makeOrder({ status: "confirmed", allowedActions: ["prepare"] })
  ),
  ["prepare"]
);

assert.deepEqual(
  getOneTimeOrderRowActions(
    makeOrder({ status: "confirmed", paymentStatus: "initiated" })
  ),
  []
);

assert.deepEqual(
  getOneTimeOrderRowActions(makeOrder({ status: "fulfilled" })),
  []
);
