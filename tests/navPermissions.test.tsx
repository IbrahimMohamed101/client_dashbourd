import assert from "node:assert/strict";
import { NavLinksData } from "../src/constants/NavLinksData";
import { filterNavItemsForRole } from "../src/lib/navPermissions";

const cashierUrls = filterNavItemsForRole(
  NavLinksData.navMain,
  "cashier"
).map((item) => item.url);

assert.deepEqual(cashierUrls, [
  "/dashboard",
  "/payments",
  "/subscriptions",
  "/one-time-orders",
  "/users",
]);

assert.equal(cashierUrls.includes("/menu"), false);
assert.equal(cashierUrls.includes("/packages"), false);
assert.equal(cashierUrls.includes("/manual-deduction"), false);

const kitchenUrls = filterNavItemsForRole(
  NavLinksData.navMain,
  "kitchen"
).map((item) => item.url);

assert.deepEqual(kitchenUrls, ["/one-time-orders", "/operations"]);
assert.equal(kitchenUrls.includes("/menu"), false);
assert.equal(kitchenUrls.includes("/manual-deduction"), false);
