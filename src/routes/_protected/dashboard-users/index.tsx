import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardStaffUsersWorkspace } from "@/components/pages/dashboard-users/DashboardStaffUsersWorkspace";
import { ROLE_DEFAULTS } from "@/constants/routes";
import { sessionQueryOptions } from "@/lib/authApi";
import { canManageDashboardStaffUsers } from "@/lib/dashboardStaffPermissions";
import type { AuthResponse, UserRole } from "@/types/auth";

export const Route = createFileRoute("/_protected/dashboard-users/")({
  beforeLoad: async ({ context }) => {
    const session = (await context.queryClient.ensureQueryData(
      sessionQueryOptions
    )) as AuthResponse;

    if (!session.user || !canManageDashboardStaffUsers(session.user)) {
      throw redirect({
        to: session.user ? ROLE_DEFAULTS[session.user.role as UserRole] : "/",
      });
    }
  },
  component: DashboardStaffUsersWorkspace,
});
