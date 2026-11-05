import { afterEach, describe, expect, it, vi } from "vitest";
import { NavLinksData } from "@/constants/NavLinksData";
import { canRoleAccessRoute } from "@/constants/routes";
import { filterNavItemsForRole } from "@/lib/navPermissions";

afterEach(() => vi.unstubAllEnvs());

describe("POS preview access", () => {
  it("keeps the direct route and navigation hidden unless enabled", () => {
    vi.stubEnv("VITE_POS_PREVIEW", "");
    expect(canRoleAccessRoute("cashier", "/pos")).toBe(false);
    expect(
      filterNavItemsForRole(NavLinksData.navMain, "cashier")
    ).not.toContainEqual(expect.objectContaining({ url: "/pos" }));
    expect(canRoleAccessRoute("cashier", "/manual-deduction")).toBe(true);
  });

  it("enables the same route and link for the selected staff roles", () => {
    vi.stubEnv("VITE_POS_PREVIEW", "true");
    vi.stubEnv("PROD", true);
    vi.stubEnv(
      "VITE_BACKEND_URL",
      "https://basicdiet145-staging-2882.up.railway.app"
    );

    for (const role of ["cashier", "restaurant", "admin", "superadmin"] as const) {
      expect(canRoleAccessRoute(role, "/pos")).toBe(true);
      expect(canRoleAccessRoute(role, "/pos/")).toBe(true);
      expect(canRoleAccessRoute(role, "/pos/menu")).toBe(true);
      expect(filterNavItemsForRole(NavLinksData.navMain, role)).toContainEqual(
        expect.objectContaining({ url: "/pos" })
      );
    }

    for (const role of [
      "kitchen",
      "courier",
      undefined,
    ] as const) {
      expect(canRoleAccessRoute(role, "/pos")).toBe(false);
      expect(
        filterNavItemsForRole(NavLinksData.navMain, role)
      ).not.toContainEqual(expect.objectContaining({ url: "/pos" }));
    }

    expect(canRoleAccessRoute("cashier", "/pos/orders")).toBe(false);
    expect(canRoleAccessRoute("kitchen", "/pos/menu")).toBe(false);
  });

  it("rejects a deployed preview connected to the production API", () => {
    vi.stubEnv("VITE_POS_PREVIEW", "true");
    vi.stubEnv("PROD", true);
    vi.stubEnv(
      "VITE_BACKEND_URL",
      "https://basicdiet145-production-51e9.up.railway.app"
    );
    expect(canRoleAccessRoute("superadmin", "/pos")).toBe(false);
  });
});
