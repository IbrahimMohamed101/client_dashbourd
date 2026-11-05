import { afterEach, describe, expect, it, vi } from "vitest";
import { canRoleAccessRoute } from "@/constants/routes";
import { canAccessPosPreview } from "./posAccess";
import { UserRoles } from "@/types/auth";

describe("POS Staging cashier menu access", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("cashier and restaurant can open POS sales and POS menu manager", () => {
    vi.stubEnv("VITE_POS_PREVIEW", "true");
    vi.stubEnv("PROD", false);
    for (const role of [UserRoles.CASHIER, UserRoles.RESTAURANT]) {
      expect(canAccessPosPreview(role, "/pos")).toBe(true);
      expect(canRoleAccessRoute(role, "/pos")).toBe(true);
      expect(canAccessPosPreview(role, "/pos/menu")).toBe(true);
      expect(canRoleAccessRoute(role, "/pos/menu")).toBe(true);
      expect(canRoleAccessRoute(role, "/menu")).toBe(true);
      expect(canRoleAccessRoute(role, "/menu/products/product-1/update")).toBe(true);
    }
  });

  it("does not accidentally grant administrator controls, courier or kitchen POS edit", () => {
    vi.stubEnv("VITE_POS_PREVIEW", "true");
    vi.stubEnv("PROD", false);
    expect(canRoleAccessRoute(UserRoles.CASHIER, "/accounting")).toBe(false);
    expect(canRoleAccessRoute(UserRoles.CASHIER, "/payments")).toBe(false);
    expect(canRoleAccessRoute(UserRoles.CASHIER, "/dashboard-users")).toBe(false);
    for (const role of [UserRoles.KITCHEN, UserRoles.COURIER]) {
      expect(canRoleAccessRoute(role, "/pos/menu")).toBe(false);
      expect(canRoleAccessRoute(role, "/pos")).toBe(false);
    }
  });

  it("POS menu is denied when preview flag is off", () => {
    vi.stubEnv("VITE_POS_PREVIEW", "false");
    for (const role of [UserRoles.CASHIER, UserRoles.RESTAURANT]) {
      expect(canRoleAccessRoute(role, "/pos/menu")).toBe(false);
      expect(canRoleAccessRoute(role, "/pos")).toBe(false);
    }
  });
});
