import assert from "node:assert/strict";
import { test } from "vitest";
import { RESTAURANT_ROUTES, canRoleAccessRoute } from "../src/constants/routes";
import { UserRoles } from "../src/types/auth";

test("restaurant can access promo code management", () => {
  assert.equal(RESTAURANT_ROUTES.includes("/promo-codes"), true);
  assert.equal(canRoleAccessRoute(UserRoles.RESTAURANT, "/promo-codes"), true);
  assert.equal(
    canRoleAccessRoute(UserRoles.RESTAURANT, "/promo-codes/promo-id"),
    true
  );
});
