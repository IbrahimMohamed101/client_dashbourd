import { UserRoles } from "@/types/auth";
import type { UserRole } from "@/types/auth";
import { canAccessPosPreview, isPosPreviewPath } from "@/features/pos/posAccess";

const SUPERADMIN_ROUTES = [
  "/dashboard",
  "/operations",
  "/one-time-orders",
  "/subscriptions",
  "/packages",
  "/users",
  "/customer-management",
  "/retention-reports",
  "/addons",
  "/delivery",
  "/payments",
  "/accounting",
  "/daily-closing",
  "/landing-leads",
  "/subscription-audit",
  "/promo-codes",
  "/zones",
  "/manual-deduction",
  "/menu",
  "/premium-meals",
  "/dashboard-users",
  "/settings",
  "/restaurant-hours",
  "/pickup-branches",
  "/notifications",
  "/profile",
];

const ADMIN_ROUTES = [
  "/daily-closing",
  "/landing-leads",
  "/dashboard",
  "/operations",
  "/one-time-orders",
  "/subscriptions",
  "/packages",
  "/users",
  "/addons",
  "/delivery",
  "/payments",
  "/accounting",
  "/subscription-audit",
  "/promo-codes",
  "/zones",
  "/manual-deduction",
  "/menu",
  "/premium-meals",
  "/settings",
  "/restaurant-hours",
  "/pickup-branches",
  "/notifications",
  "/profile",
];

const KITCHEN_ROUTES = [
  "/addons",
  "/operations",
  "/one-time-orders",
  "/menu",
  "/premium-meals",
  "/profile",
];

const COURIER_ROUTES = ["/delivery", "/operations", "/profile"];

const RESTAURANT_ROUTES = [
  "/daily-closing",
  "/landing-leads",
  "/operations",
  "/one-time-orders",
  "/subscriptions",
  "/manual-deduction",
  "/users",
  "/addons",
  "/delivery",
  "/menu",
  "/premium-meals",
  "/profile",
];

// Cashier is the operating owner of the branch and shares restaurant routes.
// Do not add admin-only or superadmin-only routes here.
const CASHIER_ROUTES = [...RESTAURANT_ROUTES];

const RESTAURANT_DENIED_ROUTES: string[] = [];

const AUTH_ROUTES = ["/"];

const ROLE_DEFAULTS: Record<UserRole, string> = {
  [UserRoles.SUPERADMIN]: "/dashboard",
  [UserRoles.ADMIN]: "/dashboard",
  [UserRoles.KITCHEN]: "/operations",
  [UserRoles.COURIER]: "/delivery",
  [UserRoles.CASHIER]: "/operations",
  [UserRoles.RESTAURANT]: "/operations",
};

const ROLE_ROUTES: Record<UserRole, string[]> = {
  [UserRoles.SUPERADMIN]: SUPERADMIN_ROUTES,
  [UserRoles.ADMIN]: ADMIN_ROUTES,
  [UserRoles.KITCHEN]: KITCHEN_ROUTES,
  [UserRoles.COURIER]: COURIER_ROUTES,
  [UserRoles.CASHIER]: CASHIER_ROUTES,
  [UserRoles.RESTAURANT]: RESTAURANT_ROUTES,
};

const ROLE_DENIED_ROUTES: Partial<Record<UserRole, string[]>> = {
  [UserRoles.RESTAURANT]: RESTAURANT_DENIED_ROUTES,
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isRouteMatch = (routes: string[], pathName: string) =>
  routes.some((route) => {
    if (!route.includes("$")) {
      return pathName === route || pathName.startsWith(`${route}/`);
    }

    const pattern = route
      .split("/")
      .map((segment) =>
        segment.startsWith("$") ? "[^/]+" : escapeRegex(segment)
      )
      .join("/");
    return new RegExp(`^${pattern}/?$`).test(pathName);
  });

const canRoleAccessRoute = (role: UserRole | undefined, pathName: string) => {
  if (!role) return false;
  if (isPosPreviewPath(pathName)) return canAccessPosPreview(role, pathName);
  if (isRouteMatch(ROLE_DENIED_ROUTES[role] ?? [], pathName)) return false;
  return isRouteMatch(ROLE_ROUTES[role] ?? [], pathName);
};

export {
  SUPERADMIN_ROUTES,
  ADMIN_ROUTES,
  KITCHEN_ROUTES,
  COURIER_ROUTES,
  CASHIER_ROUTES,
  RESTAURANT_ROUTES,
  RESTAURANT_DENIED_ROUTES,
  AUTH_ROUTES,
  ROLE_DEFAULTS,
  ROLE_ROUTES,
  ROLE_DENIED_ROUTES,
  canRoleAccessRoute,
  isRouteMatch,
};
