import { UserRoles } from "@/types/auth";
import type { UserRole } from "@/types/auth";

const SUPERADMIN_ROUTES = [
  "/dashboard",
  "/orders",
  "/one-time-orders",
  "/pickup-board",
  "/subscriptions",
  "/packages",
  "/users",
  "/premium-meals",
  "/addons",
  "/meals",
  "/categories",
  "/delivery",
  "/payments",
  "/promo-codes",
  "/zones",
  "/kitchen-board",
  "/courier-board",
];

const ADMIN_ROUTES = [
  "/dashboard",
  "/orders",
  "/one-time-orders",
  "/pickup-board",
  "/subscriptions",
  "/packages",
  "/users",
  "/premium-meals",
  "/addons",
  "/meals",
  "/categories",
  "/delivery",
  "/payments",
  "/promo-codes",
  "/zones",
  "/kitchen-board",
];

const KITCHEN_ROUTES = [
  "/kitchen-board",
  "/one-time-orders",
  "/pickup-board",
  "/meals",
  "/categories",
];

const COURIER_ROUTES = ["/courier-board", "/delivery"];

const AUTH_ROUTES = ["/"];

const ROLE_DEFAULTS: Record<UserRole, string> = {
  [UserRoles.SUPERADMIN]: "/dashboard",
  [UserRoles.ADMIN]: "/dashboard",
  [UserRoles.KITCHEN]: "/kitchen-board",
  [UserRoles.COURIER]: "/courier-board",
};

export {
  SUPERADMIN_ROUTES,
  ADMIN_ROUTES,
  KITCHEN_ROUTES,
  COURIER_ROUTES,
  AUTH_ROUTES,
  ROLE_DEFAULTS,
};
