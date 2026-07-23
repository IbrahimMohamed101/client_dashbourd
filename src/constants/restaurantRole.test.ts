import { describe, expect, it } from "vitest";
import {
  CASHIER_ROUTES,
  KITCHEN_ROUTES,
  RESTAURANT_ROUTES,
  ROLE_DEFAULTS,
  canRoleAccessRoute,
} from "@/constants/routes";
import { UserRoles } from "@/types/auth";
import {
  DASHBOARD_STAFF_ROLE_LABELS,
  defaultAssignableRoles,
} from "@/components/pages/dashboard-users/dashboardStaffUsersModel";

const inheritedRoutes = Array.from(new Set([...KITCHEN_ROUTES, ...CASHIER_ROUTES]));

describe("restaurant dashboard role", () => {
  it("combines kitchen and cashier navigation", () => {
    expect(RESTAURANT_ROUTES).toEqual(inheritedRoutes);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/operations")).toBe(true);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/manual-deduction")).toBe(true);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/users")).toBe(true);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/menu")).toBe(true);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/addons")).toBe(true);
  });

  it("does not inherit admin or courier-only pages", () => {
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/dashboard-users")).toBe(false);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/accounting")).toBe(false);
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/delivery")).toBe(false);
  });

  it("uses restaurant as the default operational staff role", () => {
    expect(ROLE_DEFAULTS[UserRoles.RESTAURANT]).toBe("/operations");
    expect(defaultAssignableRoles()).toEqual(["admin", "restaurant", "courier"]);
    expect(DASHBOARD_STAFF_ROLE_LABELS.restaurant).toBe("المطعم");
  });
});
