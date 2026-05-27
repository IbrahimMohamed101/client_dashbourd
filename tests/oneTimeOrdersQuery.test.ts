import assert from "node:assert/strict";
import { buildOneTimeOrdersQuery } from "../src/utils/fetchOneTimeOrders";

const query = buildOneTimeOrdersQuery({
  fulfillmentMethod: "pickup",
  status: "confirmed",
  branchId: "branch-1",
  q: "ORD-1",
  page: 3,
  limit: 15,
});

assert.equal(query.includes("branchId="), false);
assert.equal(
  query,
  "fulfillmentMethod=pickup&status=confirmed&q=ORD-1&page=3&limit=15"
);
