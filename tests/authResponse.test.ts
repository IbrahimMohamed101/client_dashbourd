import assert from "node:assert/strict";
import { normalizeAuthResponse } from "../src/lib/authResponse";
import { isUserRole, UserRoles } from "../src/types/auth";
import { test } from "vitest";

test("authResponse.test", () => {
  const nested = normalizeAuthResponse({
    status: true,
    token: "token-1",
    data: {
      user: {
        id: "user-1",
        name: "Cashier",
        email: "cashier@example.com",
        role: "cashier",
        isActive: true,
        lastLoginAt: "2026-05-18T00:00:00.000Z",
        createdAt: "2026-05-18T00:00:00.000Z",
        updatedAt: "2026-05-18T00:00:00.000Z",
      },
    },
  });

  assert.equal(nested.user?.id, "user-1");
  assert.equal(nested.user?.role, "cashier");
  assert.equal(nested.token, "token-1");

  const root = normalizeAuthResponse({
    status: true,
    user: {
      id: "user-2",
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
      isActive: true,
      lastLoginAt: "2026-05-18T00:00:00.000Z",
      createdAt: "2026-05-18T00:00:00.000Z",
      updatedAt: "2026-05-18T00:00:00.000Z",
    },
  });

  assert.equal(root.user?.id, "user-2");
  assert.equal(root.user?.role, "admin");

  const restaurant = normalizeAuthResponse({
    status: true,
    user: {
      id: "user-3",
      name: "Restaurant",
      email: "restaurant@example.com",
      role: "restaurant",
      isActive: true,
      lastLoginAt: "2026-05-18T00:00:00.000Z",
      createdAt: "2026-05-18T00:00:00.000Z",
      updatedAt: "2026-05-18T00:00:00.000Z",
    },
  });

  assert.equal(restaurant.user?.role, UserRoles.RESTAURANT);
  assert.equal(isUserRole(restaurant.user?.role), true);
  assert.equal(isUserRole("unknown"), false);

  const empty = normalizeAuthResponse({ status: false });
  assert.equal(empty.user, null);
});
