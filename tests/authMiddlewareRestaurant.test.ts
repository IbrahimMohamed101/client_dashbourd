import assert from "node:assert/strict";
import { test, vi } from "vitest";
import { authMiddleware } from "../src/lib/authMiddleware";
import { UserRoles } from "../src/types/auth";

vi.mock("@tanstack/react-router", () => ({
  redirect: (args: unknown) => ({ redirect: args }),
}));

const restaurantSession = {
  status: true,
  token: "token",
  user: {
    id: "restaurant-user",
    name: "Restaurant User",
    email: "restaurant@example.com",
    role: UserRoles.RESTAURANT,
    isActive: true,
    lastLoginAt: "",
    createdAt: "",
    updatedAt: "",
  },
};

test("restaurant auth middleware allows read routes and blocks nested admin routes", () => {
  assert.doesNotThrow(() => authMiddleware(restaurantSession, "/operations"));
  assert.doesNotThrow(() => authMiddleware(restaurantSession, "/users/user-1"));

  assert.throws(
    () => authMiddleware(restaurantSession, "/addons/create"),
    (error) => {
      assert.deepEqual(error, { redirect: { to: "/operations" } });
      return true;
    }
  );
  assert.throws(
    () => authMiddleware(restaurantSession, "/users/user-1/create-subscription"),
    (error) => {
      assert.deepEqual(error, { redirect: { to: "/operations" } });
      return true;
    }
  );
});

