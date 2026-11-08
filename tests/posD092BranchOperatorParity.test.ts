import { describe, expect, it, vi } from "vitest";
import { UserRoles } from "../src/types/auth";
import {
  BRANCH_OPERATOR_ROLES,
  isBranchOperator,
  allowedSubscriptionPaymentMethods,
  canCreateUnpaidSubscription,
  canManageRestaurantData,
  canManageCustomerPasswords,
  canCreateAppCustomer,
  canCreateCustomerSubscription,
  canManageMenuData,
  canManageMealBuilder,
  canManagePremiumUpgrades,
  canManageAddonPlans,
} from "../src/lib/rolePermissions";
import {
  ROLE_ROUTES, ROLE_DENIED_ROUTES, ROLE_DEFAULTS,
  SUPERADMIN_ROUTES, ADMIN_ROUTES, KITCHEN_ROUTES, COURIER_ROUTES,
  RESTAURANT_ROUTES, CASHIER_ROUTES, canRoleAccessRoute,
} from "../src/constants/routes";
import { getScreensForRole, OPERATIONS_SCREENS } from "../src/lib/operationsBoard";
import { canAccessPosPreview } from "../src/features/pos/posAccess";

const branch = [UserRoles.CASHIER, UserRoles.RESTAURANT] as const;
const capabilities = [
  canManageRestaurantData, canManageCustomerPasswords,
  canCreateAppCustomer, canCreateCustomerSubscription,
  canManageMenuData, canManageMealBuilder,
  canManagePremiumUpgrades, canManageAddonPlans,
] as const;

describe("D-092: same permission matrix for cashier and restaurant", () => {
  it("has one source of branch roles, with original role labels kept separately", () => {
    expect(BRANCH_OPERATOR_ROLES).toEqual(["restaurant", "cashier"]);
    expect(isBranchOperator(branch[0])).toBe(true);
    expect(isBranchOperator(branch[1])).toBe(true);
    expect(isBranchOperator(UserRoles.KITCHEN)).toBe(false);
    expect(isBranchOperator(UserRoles.COURIER)).toBe(false);
    expect(ROLE_ROUTES[branch[0]]).toBe(ROLE_ROUTES[branch[1]]);
    expect(ROLE_DEFAULTS[branch[0]]).toBe(ROLE_DEFAULTS[branch[1]]);
    expect(CASHIER_ROUTES).toBe(RESTAURANT_ROUTES);
    expect(ROLE_DENIED_ROUTES[branch[0]]).toBe(ROLE_DENIED_ROUTES[branch[1]]);
  });

  it("checks every declared dashboard route and representative nested paths", () => {
    const declared = [
      ...SUPERADMIN_ROUTES, ...ADMIN_ROUTES, ...KITCHEN_ROUTES,
      ...COURIER_ROUTES, ...RESTAURANT_ROUTES, ...CASHIER_ROUTES,
    ];
    const nested = [
      "/users/create", "/users/customer-1", "/users/customer-1/create-subscription",
      "/subscriptions/create", "/subscriptions/subscription-1",
      "/operations/overview", "/manual-deduction/new", "/pos", "/pos/menu",
      "/menu/products/product-1/update", "/daily-closing/today",
      "/dashboard-users", "/payments", "/settings", "/accounting",
    ];
    for (const path of new Set([...declared, ...nested])) {
      expect(canRoleAccessRoute(branch[0], path), path)
        .toBe(canRoleAccessRoute(branch[1], path));
    }
  });

  it("compares every exported management capability and POS access", () => {
    for (const capability of capabilities) {
      expect(capability(branch[0])).toBe(capability(branch[1]));
    }
    for (const path of ["/pos", "/pos/menu", "/pos/", "/pos/menu/"]) {
      expect(canAccessPosPreview(branch[0], path))
        .toBe(canAccessPosPreview(branch[1], path));
    }
    vi.stubEnv("VITE_POS_PREVIEW", "true");
    try {
      for (const path of ["/pos", "/pos/menu"]) {
        expect(canAccessPosPreview(branch[0], path))
          .toBe(canAccessPosPreview(branch[1], path));
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("has exactly equal operational screens; only the displayed role label may differ", () => {
    const a = getScreensForRole(branch[0]);
    const b = getScreensForRole(branch[1]);
    expect(a.screens).toEqual(b.screens);
    expect(a.screens).toEqual([...OPERATIONS_SCREENS]);
    expect(getScreensForRole(UserRoles.KITCHEN).screens).toEqual(["kitchen", "pickup"]);
    expect(getScreensForRole(UserRoles.COURIER).screens).toEqual(["courier"]);
  });

  it("uses cash and Visa/Mada equivalently and forbids free branch subscriptions", () => {
    expect(allowedSubscriptionPaymentMethods(branch[0]))
      .toEqual(allowedSubscriptionPaymentMethods(branch[1]));
    expect(allowedSubscriptionPaymentMethods(branch[0])).toEqual(["cash", "visa"]);
    expect(canCreateUnpaidSubscription(branch[0])).toBe(false);
    expect(canCreateUnpaidSubscription(branch[1])).toBe(false);
    expect(canCreateUnpaidSubscription(UserRoles.ADMIN)).toBe(true);
    expect(canCreateUnpaidSubscription(UserRoles.SUPERADMIN)).toBe(true);
    expect(allowedSubscriptionPaymentMethods(UserRoles.COURIER)).toEqual([]);
    expect(allowedSubscriptionPaymentMethods(UserRoles.KITCHEN)).toEqual([]);
  });
});
