import { describe, expect, it } from "vitest";
import { canRoleAccessRoute } from "@/constants/routes";

describe("landing lead CRM route permissions", () => {
  it("allows the three authorized management roles", () => {
    expect(canRoleAccessRoute("superadmin", "/landing-leads")).toBe(true);
    expect(canRoleAccessRoute("admin", "/landing-leads")).toBe(true);
    expect(canRoleAccessRoute("restaurant", "/landing-leads")).toBe(true);
  });

  it("grants cashier the restaurant CRM access but denies kitchen/courier", () => {
    expect(canRoleAccessRoute("cashier", "/landing-leads")).toBe(true);
    expect(canRoleAccessRoute("kitchen", "/landing-leads")).toBe(false);
    expect(canRoleAccessRoute("courier", "/landing-leads")).toBe(false);
  });
});
