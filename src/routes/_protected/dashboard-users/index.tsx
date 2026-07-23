import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardStaffUsersWorkspace } from "@/components/pages/dashboard-users/DashboardStaffUsersWorkspace";
import { ROLE_DEFAULTS } from "@/constants/routes";
import { sessionQueryOptions } from "@/lib/authApi";
import { canManageDashboardStaffUsers } from "@/lib/dashboardStaffPermissions";
import { isUserRole, type AuthResponse } from "@/types/auth";

export const Route = createFileRoute("/_protected/dashboard-users/")({
  beforeLoad: async ({ context }) => {
    const session = (await context.queryClient.ensureQueryData(
      sessionQueryOptions
    )) as AuthResponse;

    if (!session.user || !canManageDashboardStaffUsers(session.user)) {
      const fallback = isUserRole(session.user?.role)
        ? ROLE_DEFAULTS[session.user.role]
        : "/";
      throw redirect({
        to: session.user ? fallback : "/",
      });
    }
  },
  component: DashboardStaffUsersWorkspace,
});
