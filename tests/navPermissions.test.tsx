import assert from "node:assert/strict";
import { NavLinksData } from "../src/constants/NavLinksData";
import { filterNavItemsForRole } from "../src/lib/navPermissions";

const navMainUrlsForRole = (role: Parameters<typeof filterNavItemsForRole>[1]) =>
  filterNavItemsForRole(NavLinksData.navMain, role).map((item) => item.url);

const secondaryUrlsForRole = (
  role: Parameters<typeof filterNavItemsForRole>[1]
) => filterNavItemsForRole(NavLinksData.navSecondary, role).map((item) => item.url);

const cashierUrls = filterNavItemsForRole(
  NavLinksData.navMain,
  "cashier"
).map((item) => item.url);

assert.deepEqual(cashierUrls, [
  "/operations",
  "/manual-deduction",
  "/users",
]);

assert.equal(cashierUrls.includes("/payments"), false);
assert.equal(cashierUrls.includes("/subscriptions"), false);
assert.equal(cashierUrls.includes("/menu"), false);
assert.equal(cashierUrls.includes("/packages"), false);

const kitchenUrls = filterNavItemsForRole(
  NavLinksData.navMain,
  "kitchen"
).map((item) => item.url);

assert.deepEqual(kitchenUrls, [
  "/addons",
  "/operations",
  "/menu",
  "/premium-meals",
]);
assert.equal(kitchenUrls.includes("/manual-deduction"), false);
assert.equal(kitchenUrls.includes("/users"), false);
assert.equal(kitchenUrls.includes("/delivery"), false);

assert.deepEqual(navMainUrlsForRole("courier"), ["/delivery"]);
assert.equal(navMainUrlsForRole("courier").includes("/operations"), false);

assert.deepEqual(navMainUrlsForRole("admin"), [
  "/dashboard",
  "/payments",
  "/accounting",
  "/promo-codes",
  "/addons",
  "/packages",
  "/subscriptions",
  "/operations",
  "/manual-deduction",
  "/menu",
  "/premium-meals",
  "/delivery",
  "/zones",
  "/users",
  "/dashboard-users",
]);

assert.deepEqual(navMainUrlsForRole("superadmin"), navMainUrlsForRole("admin"));

assert.deepEqual(secondaryUrlsForRole("admin"), [
  "/settings",
  "/restaurant-hours",
  "/pickup-branches",
  "/notifications",
]);
assert.deepEqual(secondaryUrlsForRole("superadmin"), secondaryUrlsForRole("admin"));
assert.deepEqual(secondaryUrlsForRole("kitchen"), []);
assert.deepEqual(secondaryUrlsForRole("courier"), []);
assert.deepEqual(secondaryUrlsForRole("cashier"), []);
