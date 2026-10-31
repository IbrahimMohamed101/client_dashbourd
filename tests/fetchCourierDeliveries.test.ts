import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";
import { fetchCourierDeliveryList } from "../src/utils/fetchCourierDeliveries";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/lib/apis", () => ({
  default: {
    get: mocks.get,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("courier delivery list renders actions only from backend allowedActions", async () => {
  mocks.get.mockResolvedValue({
    data: {
      status: true,
      meta: { readOnly: true, role: "restaurant" },
      data: [
        {
          id: "delivery-1",
          entityId: "delivery-1",
          type: "subscription",
          status: "out_for_delivery",
          scheduledDate: "2026-07-26",
          deliveryWindow: "10:00-12:00",
          customerName: "Customer",
          customerPhone: "+966500000000",
          canCourierPickup: true,
          canMarkArrivingSoon: true,
          canMarkDelivered: true,
          canCancel: true,
          allowedActions: [],
          allowedActionIds: [],
        },
      ],
    },
  });

  const response = await fetchCourierDeliveryList();
  const [item] = response.data.items;

  assert.equal(mocks.get.mock.calls[0][0], "/api/courier/deliveries/today");
  assert.equal(item.id, "delivery-1");
  assert.deepEqual(item.allowedActions, []);
});

for (const allowedActions of [[], null, {}]) {
  test(`explicit invalid/empty actions cannot reactivate legacy courier flags: ${JSON.stringify(allowedActions)}`, async () => {
    mocks.get.mockResolvedValue({ data: { status: true, data: [{
      id: "synthetic-delivery", canCourierPickup: true, allowedActions,
    }] } });
    const response = await fetchCourierDeliveryList("2026-10-31");
    assert.deepEqual(response.data.items[0].allowedActions, []);
  });
}

test("read-only response metadata overrides legacy flags and supplied actions", async () => {
  mocks.get.mockResolvedValue({ data: { status: true, meta: { readOnly: true }, data: [{
    id: "synthetic-delivery", canCourierPickup: true,
    allowedActions: [{ id: "pickup", label: "Pickup", method: "PUT", endpoint: "/api/courier/deliveries/synthetic-delivery/collect" }],
  }] } });
  const response = await fetchCourierDeliveryList("2026-10-31");
  assert.deepEqual(response.data.items[0].allowedActions, []);
});

test("missing modern actions retains only explicit legacy capabilities", async () => {
  mocks.get.mockResolvedValue({ data: { status: true, data: [{
    id: "synthetic-delivery", canCourierPickup: true, canMarkDelivered: false,
  }] } });
  const response = await fetchCourierDeliveryList("2026-10-31");
  assert.deepEqual(response.data.items[0].allowedActions.map((action) => action.id), ["pickup"]);
});
