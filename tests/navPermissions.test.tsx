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
  "/orders",
  "/one-time-orders",
  "/users",
]);

assert.equal(cashierUrls.includes("/menu"), false);
assert.equal(cashierUrls.includes("/packages"), false);
assert.equal(cashierUrls.includes("/manual-deduction"), false);
