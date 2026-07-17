import type { CustomerAuthState, User } from "@/types/userTypes";

export type AuthFilterValue =
  | "all"
  | CustomerAuthState
  | "inactive";

export function getCustomerAuthState(user: User): CustomerAuthState {
  if (
    user.authState === "temporary_password" ||
    user.authState === "temporary_password_expired" ||
    user.authState === "active"
  ) {
    return user.authState;
  }

  if (user.forcePasswordChange) {
    const expiresAt = user.temporaryPasswordExpiresAt
      ? new Date(user.temporaryPasswordExpiresAt).getTime()
      : NaN;
    return Number.isFinite(expiresAt) && expiresAt < Date.now()
      ? "temporary_password_expired"
      : "temporary_password";
  }

  return "active";
}

export function getCustomerAuthStateLabel(state: CustomerAuthState) {
  switch (state) {
    case "temporary_password":
      return "كلمة مرور مؤقتة";
    case "temporary_password_expired":
      return "انتهت كلمة المرور المؤقتة";
    default:
      return "مفعل";
  }
}

export function getCustomerAccountStatusLabel(status?: User["accountStatus"]) {
  switch (status) {
    case "active":
      return "نشط";
    case "pending_activation":
      return "بانتظار التفعيل";
    case "reset_requested":
      return "طلب إعادة تعيين";
    default:
      return "—";
  }
}

export function getTemporaryPasswordReasonLabel(
  reason?: User["temporaryPasswordReason"]
) {
  switch (reason) {
    case "admin_created":
      return "تم إنشاؤها بواسطة الإدارة";
    case "admin_reset":
      return "إعادة تعيين بواسطة الإدارة";
    default:
      return "—";
  }
}

export function formatCustomerDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(date)} (بتوقيت الرياض)`;
}

export function formatExpiry(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  if (date.getTime() < Date.now()) return "انتهت";
  return formatCustomerDateTime(value);
}

export function customerMatchesAuthFilter(user: User, filter: AuthFilterValue) {
  if (filter === "all") return true;
  if (filter === "inactive") return !user.isActive;
  if (!user.isActive) return false;
  return getCustomerAuthState(user) === filter;
}
