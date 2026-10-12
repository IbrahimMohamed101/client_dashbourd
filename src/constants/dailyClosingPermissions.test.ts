import { describe, expect, it } from "vitest";
import { canRoleAccessRoute } from "./routes";
import { UserRoles } from "@/types/auth";

describe("daily closing role gate and navigation", () => {
  it("allows restaurant, cashier and management only", () => {
    for (const role of [UserRoles.RESTAURANT, UserRoles.CASHIER, UserRoles.ADMIN, UserRoles.SUPERADMIN]) {
      expect(canRoleAccessRoute(role, "/daily-closing")).toBe(true);
    }
    for (const role of [UserRoles.KITCHEN, UserRoles.COURIER]) {
      expect(canRoleAccessRoute(role, "/daily-closing")).toBe(false);
    }
  });

  it("does not expose accounting full page to restaurant and cashier", () => {
    expect(canRoleAccessRoute(UserRoles.RESTAURANT, "/accounting")).toBe(false);
    expect(canRoleAccessRoute(UserRoles.CASHIER, "/accounting")).toBe(false);
  });
});
