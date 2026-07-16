import { UserRoles } from "@/types/auth";
import type { User } from "@/types/auth";

export const isSuperadmin = (
  user: Pick<User, "role"> | null | undefined
) => user?.role === UserRoles.SUPERADMIN;

export const canManageDashboardStaffUsers = isSuperadmin;
