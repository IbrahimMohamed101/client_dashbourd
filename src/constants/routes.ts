import { UserRoles } from "@/types/auth";
import type { UserRole } from "@/types/auth";

const SUPERADMIN_ROUTES = [
  "/dashboard",
  "/orders",
  "/one-time-orders",
  "/operations",
  "/subscriptions",
  "/packages",
  "/users",
  "/addons",
  "/delivery",
  "/payments",
  "/promo-codes",
  "/zones",
  "/manual-deduction",
  "/menu",
];

const ADMIN_ROUTES = [
  "/dashboard",
  "/orders",
  "/one-time-orders",
  "/operations",
  "/subscriptions",
  "/packages",
  "/users",
  "/addons",
  "/delivery",
  "/payments",
  "/promo-codes",
  "/zones",
  "/manual-deduction",
  "/menu",
];

const KITCHEN_ROUTES = ["/operations", "/one-time-orders"];

const COURIER_ROUTES = ["/operations", "/delivery"];

const CASHIER_ROUTES = [
  "/dashboard",
  "/orders",
  "/one-time-orders",
  "/subscriptions",
  "/payments",
  "/users",
];

const AUTH_ROUTES = ["/"];

const ROLE_DEFAULTS: Record<UserRole, string> = {
  [UserRoles.SUPERADMIN]: "/dashboard",
  [UserRoles.ADMIN]: "/dashboard",
  [UserRoles.KITCHEN]: "/operations",
  [UserRoles.COURIER]: "/operations",
  [UserRoles.CASHIER]: "/dashboard",
};

export {
  SUPERADMIN_ROUTES,
  ADMIN_ROUTES,
  KITCHEN_ROUTES,
  COURIER_ROUTES,
  CASHIER_ROUTES,
  AUTH_ROUTES,
  ROLE_DEFAULTS,
};
