import { UserRoles, type UserRole } from "@/types/auth";
import { isBranchOperator } from "@/lib/rolePermissions";

const stagingApiOrigins = new Set([
  "https://basicdiet145-staging.up.railway.app",
  "https://basicdiet145-staging-2882.up.railway.app",
]);

export function isPosPreviewPath(path: string) {
  return (
    path === "/pos" ||
    path === "/pos/" ||
    path === "/pos/menu" ||
    path === "/pos/menu/"
  );
}

export function canAccessPosPreview(role: UserRole, path = "/pos") {
  if (import.meta.env.VITE_POS_PREVIEW !== "true") return false;

  // In a deployed build, hide the preview if the shared API is not Staging.
  if (
    import.meta.env.PROD &&
    !stagingApiOrigins.has(
      String(import.meta.env.VITE_BACKEND_URL).replace(/\/$/, "")
    )
  ) {
    return false;
  }

  return isPosPreviewPath(path) && (
    isBranchOperator(role) ||
    role === UserRoles.ADMIN ||
    role === UserRoles.SUPERADMIN
  );
}
