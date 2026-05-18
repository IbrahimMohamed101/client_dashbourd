import assert from "node:assert/strict";
import { CASHIER_ROUTES } from "../routes";

assert.deepEqual(CASHIER_ROUTES, [
  "/dashboard",
  "/orders",
  "/one-time-orders",
  "/subscriptions",
  "/payments",
  "/users",
]);

assert.equal(CASHIER_ROUTES.includes("/manual-deduction"), false);
assert.equal(CASHIER_ROUTES.includes("/pickup-board"), false);
assert.equal(CASHIER_ROUTES.includes("/menu"), false);
assert.equal(CASHIER_ROUTES.includes("/packages"), false);
