import assert from "node:assert/strict";
import {
  subscriptionAddonEntitlementsUrl,
  subscriptionBalancesUrl,
  subscriptionDeliveryUrl,
  subscriptionExtendUrl,
} from "../src/utils/subscriptionApiContract";

assert.equal(
  subscriptionExtendUrl("sub-1"),
  "/api/dashboard/subscriptions/sub-1/extend"
);

assert.equal(
  subscriptionDeliveryUrl("sub-1"),
  "/api/dashboard/subscriptions/sub-1/delivery"
);

assert.equal(
  subscriptionBalancesUrl("sub-1"),
  "/api/dashboard/subscriptions/sub-1/balances"
);

assert.equal(
  subscriptionAddonEntitlementsUrl("sub-1"),
  "/api/dashboard/subscriptions/sub-1/addon-entitlements"
);
