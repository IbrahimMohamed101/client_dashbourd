import { UserRoles, type UserRole } from "@/types/auth";
import type { DashboardStaffRole } from "@/types/dashboardAdminTypes";

type RoleLabelLocale = "ar" | "en";

const ROLE_LABELS: Record<UserRole, Record<RoleLabelLocale, string>> = {
  [UserRoles.SUPERADMIN]: {
    ar: "سوبر أدمن",
    en: "Superadmin",
  },
  [UserRoles.ADMIN]: {
    ar: "مدير",
    en: "Admin",
  },
  [UserRoles.KITCHEN]: {
    ar: "المطبخ — قديم",
    en: "Kitchen — Legacy",
  },
  [UserRoles.COURIER]: {
    ar: "مندوب التوصيل",
    en: "Courier",
  },
  [UserRoles.CASHIER]: {
    ar: "الكاشير — قديم",
    en: "Cashier — Legacy",
  },
  [UserRoles.RESTAURANT]: {
    ar: "المطعم",
    en: "Restaurant",
  },
};

export const getRoleLabel = (
  role: UserRole | DashboardStaffRole | string | null | undefined,
  locale: RoleLabelLocale = "ar"
) => {
  const labels = ROLE_LABELS[role as UserRole];
  return labels?.[locale] ?? "";
};

export const getDashboardStaffRoleLabel = (
  role: DashboardStaffRole,
  locale: RoleLabelLocale = "ar"
) => getRoleLabel(role, locale) || role;
