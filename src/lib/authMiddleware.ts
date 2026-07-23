import { redirect } from "@tanstack/react-router";
import { isUserRole, type AuthResponse } from "@/types/auth";
import {
  AUTH_ROUTES,
  ROLE_DEFAULTS,
  canRoleAccessRoute,
  isRouteMatch,
} from "@/constants/routes";

export const authMiddleware = (
  session: AuthResponse | null | undefined,
  pathName: string,
  searchParams: Record<string, string> = {}
) => {
  const isAuthRoute = isRouteMatch(AUTH_ROUTES, pathName);

  // No session → send to login, preserve intended destination
  if (!session?.user) {
    if (isAuthRoute) return; // already on login, do nothing
    throw redirect({ to: "/", search: { redirect: pathName } });
  }

  const role = session.user.role;
  if (!isUserRole(role)) throw redirect({ to: "/" });

  const defaultRoute = ROLE_DEFAULTS[role];

  // Unknown role → kick to login
  if (!defaultRoute) throw redirect({ to: "/" });

  // Logged-in user on auth route → send back or to default
  if (isAuthRoute) {
    const returnTo = searchParams.redirect ?? defaultRoute;
    throw redirect({ to: returnTo });
  }

  // Not allowed for this role → send to their default
  if (!canRoleAccessRoute(role, pathName)) {
    throw redirect({ to: defaultRoute });
  }
};
