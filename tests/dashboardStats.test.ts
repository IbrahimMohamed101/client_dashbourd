import assert from "node:assert/strict";
import { mapDashboardStatsToCards } from "../src/lib/dashboardStats";

const cards = [
  { description: "Active", value: "old", icon: null },
  { description: "Deliveries", value: "old", icon: null },
  { description: "Pending", value: "old", icon: null },
  { description: "Users", value: "old", icon: null },
];

const mapped = mapDashboardStatsToCards(cards, {
  activeSubscriptions: 12,
  deliveriesToday: 5,
  pendingOrders: 7,
  appUsers: 44,
});

assert.deepEqual(
  mapped.map((card) => card.value),
  ["12", "5", "7", "44"]
);

const empty = mapDashboardStatsToCards(cards, undefined);
assert.deepEqual(
  empty.map((card) => card.value),
  ["0", "0", "0", "0"]
);
