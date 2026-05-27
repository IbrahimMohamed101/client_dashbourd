import assert from "node:assert/strict";
import { CASHIER_ROUTES, KITCHEN_ROUTES } from "../src/constants/routes";

assert.deepEqual(CASHIER_ROUTES, [
  "/dashboard",
  "/one-time-orders",
  "/subscriptions",
  "/payments",
  "/users",
]);

assert.equal(CASHIER_ROUTES.includes("/manual-deduction"), false);
assert.equal(CASHIER_ROUTES.includes("/pickup-board"), false);
assert.equal(CASHIER_ROUTES.includes("/menu"), false);
assert.equal(CASHIER_ROUTES.includes("/packages"), false);

assert.deepEqual(KITCHEN_ROUTES, ["/operations", "/one-time-orders"]);
assert.equal(KITCHEN_ROUTES.includes("/menu"), false);
assert.equal(KITCHEN_ROUTES.includes("/manual-deduction"), false);
