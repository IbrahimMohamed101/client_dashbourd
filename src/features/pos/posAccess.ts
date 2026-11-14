import { UserRoles, type UserRole } from "@/types/auth";
import { isBranchOperator } from "@/lib/rolePermissions";

export function isPosPreviewPath(path: string) {
  return path === "/pos" || path === "/pos/" ||
    path === "/pos/menu" || path === "/pos/menu/";
}
export function canAccessPosPreview(role: UserRole, path = "/pos") {
  // Role-only route policy; server /api/dashboard/pos/status controls
  // visibility AND the backend guards every operation. No VITE-only allowlist.
  return isPosPreviewPath(path) && (
    isBranchOperator(role) || role === UserRoles.ADMIN ||
    role === UserRoles.SUPERADMIN
  );
}
