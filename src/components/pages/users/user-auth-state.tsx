import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/userTypes";
import {
  getCustomerAuthState,
  getCustomerAuthStateLabel,
} from "./user-auth-utils";

export function CustomerAuthStateBadge({ user }: { user: User }) {
  if (!user.isActive) {
    return <Badge variant="secondary">غير نشط</Badge>;
  }

  const state = getCustomerAuthState(user);
  if (state === "temporary_password_expired") {
    return <Badge variant="destructive">{getCustomerAuthStateLabel(state)}</Badge>;
  }
  if (state === "temporary_password") {
    return <Badge variant="secondary">{getCustomerAuthStateLabel(state)}</Badge>;
  }
  return <Badge variant="default">{getCustomerAuthStateLabel(state)}</Badge>;
}
