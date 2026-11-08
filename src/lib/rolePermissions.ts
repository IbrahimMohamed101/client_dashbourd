import { UserRoles } from "@/types/auth";

// D-092: a single branch-operator principal for ALL permission decisions.
// Keep the actual user role intact for labels and audit. Do not spread two
// separately maintained allowlists through the dashboard.
export const BRANCH_OPERATOR_ROLES = Object.freeze([
  UserRoles.RESTAURANT,
  UserRoles.CASHIER,
] as const);

export function isBranchOperator(role: unknown): role is
  typeof UserRoles.RESTAURANT | typeof UserRoles.CASHIER {
  return typeof role === "string" &&
    BRANCH_OPERATOR_ROLES.some((candidate) => candidate === role);
}

const MANAGEMENT_ROLES: ReadonlySet<string> = new Set([
  UserRoles.SUPERADMIN,
  UserRoles.ADMIN,
]);

export function canManageRestaurantData(role: unknown): boolean {
  return isBranchOperator(role) ||
    (typeof role === "string" && MANAGEMENT_ROLES.has(role));
}

export function canManageCustomerPasswords(role: unknown): boolean {
  return canManageRestaurantData(role);
}

// Manual subscription collection is available to both branch operator labels
// with exactly the same choices. Free/zero-recorded-payment creation is an
// administrator privilege, not a cashier/restaurant difference.
export const SUBSCRIPTION_PAYMENT_METHODS = Object.freeze(["cash", "visa"] as const);
export function allowedSubscriptionPaymentMethods(role: unknown) {
  return canManageRestaurantData(role) ? SUBSCRIPTION_PAYMENT_METHODS : [];
}
export function canCreateUnpaidSubscription(role: unknown): boolean {
  return role === UserRoles.ADMIN || role === UserRoles.SUPERADMIN;
}

export const canCreateAppCustomer = canManageRestaurantData;
export const canCreateCustomerSubscription = canManageRestaurantData;
export const canManageMenuData = canManageRestaurantData;
export const canManageMealBuilder = canManageRestaurantData;
export const canManagePremiumUpgrades = canManageRestaurantData;
export const canManageAddonPlans = canManageRestaurantData;
