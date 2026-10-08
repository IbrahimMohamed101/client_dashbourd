import { describe, expect, it } from "vitest";
import { canRoleAccessRoute } from "@/constants/routes";

describe("landing lead CRM route permissions", () => {
  it("allows the three authorized management roles", () => {
    expect(canRoleAccessRoute("superadmin", "/landing-leads")).toBe(true);
    expect(canRoleAccessRoute("admin", "/landing-leads")).toBe(true);
    expect(canRoleAccessRoute("restaurant", "/landing-leads")).toBe(true);
  });

  it("does not expose customer phone numbers to operational-only roles", () => {
    expect(canRoleAccessRoute("cashier", "/landing-leads")).toBe(false);
    expect(canRoleAccessRoute("kitchen", "/landing-leads")).toBe(false);
    expect(canRoleAccessRoute("courier", "/landing-leads")).toBe(false);
  });
});
