import type { UserRole } from "@/types/auth";
import type { ReactNode } from "react";
import {
  ADMIN_ROUTES,
  CASHIER_ROUTES,
  COURIER_ROUTES,
  KITCHEN_ROUTES,
  SUPERADMIN_ROUTES,
} from "@/constants/routes";

export type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
};

const ROLE_ROUTES: Record<UserRole, string[]> = {
  superadmin: SUPERADMIN_ROUTES,
  admin: ADMIN_ROUTES,
  kitchen: KITCHEN_ROUTES,
  courier: COURIER_ROUTES,
  cashier: CASHIER_ROUTES,
};

export function filterNavItemsForRole(
  items: NavItem[],
  role: UserRole | undefined
) {
  if (!role) return [];
  const allowedRoutes = ROLE_ROUTES[role] ?? [];

  return items.filter((item) => allowedRoutes.includes(item.url));
}
