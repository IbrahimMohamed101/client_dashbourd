import type { UserRole } from "@/types/auth";
import type { ReactNode } from "react";
import { canRoleAccessRoute } from "@/constants/routes";

export type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
};

export function filterNavItemsForRole(
  items: NavItem[],
  role: UserRole | undefined
) {
  if (!role) return [];
  return items.filter((item) => canRoleAccessRoute(role, item.url));
}
