import { z } from "zod";
import type {
  CreateDashboardStaffUserPayload,
  DashboardStaffRole,
  DashboardStaffUserDto,
  UpdateDashboardStaffUserPayload,
} from "@/types/dashboardAdminTypes";
import {
  SUPPORTED_DASHBOARD_STAFF_ROLES,
  isDashboardStaffRole,
  normalizeDashboardStaffRoles,
} from "@/utils/fetchDashboardUsers";

export const DASHBOARD_STAFF_ROLE_LABELS: Record<
  DashboardStaffRole,
  string
> = {
  admin: "مدير",
  kitchen: "المطبخ",
  courier: "مندوب التوصيل",
  cashier: "الكاشير",
};

export const DASHBOARD_STAFF_STATUS_LABELS = {
  active: "نشط",
  inactive: "غير نشط",
} as const;

const passwordSchema = z
  .string()
  .min(12, "كلمة المرور يجب أن تكون 12 حرفا على الأقل.")
  .regex(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير.")
  .regex(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير.")
  .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم.")
  .regex(/[^A-Za-z0-9]/, "كلمة المرور يجب أن تحتوي على رمز.");

const roleSchema = z.custom<DashboardStaffRole>(
  isDashboardStaffRole,
  "نوع صلاحية المستخدم غير صحيح."
);

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("البريد الإلكتروني غير صحيح.");

export const createDashboardStaffUserSchema = z
  .object({
    email: emailSchema,
    role: roleSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    isActive: z.boolean(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "تأكيد كلمة المرور غير مطابق.",
  });

export const editDashboardStaffUserSchema = z.object({
  email: emailSchema,
  role: roleSchema,
  isActive: z.boolean(),
});

export const resetDashboardStaffPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "تأكيد كلمة المرور غير مطابق.",
  });

export type CreateDashboardStaffUserFormValues = z.input<
  typeof createDashboardStaffUserSchema
>;

export type ParsedCreateDashboardStaffUserFormValues = z.output<
  typeof createDashboardStaffUserSchema
>;

export type EditDashboardStaffUserFormValues = z.input<
  typeof editDashboardStaffUserSchema
>;

export type ParsedEditDashboardStaffUserFormValues = z.output<
  typeof editDashboardStaffUserSchema
>;

export type ResetDashboardStaffPasswordFormValues = z.input<
  typeof resetDashboardStaffPasswordSchema
>;

export const defaultAssignableRoles = (): DashboardStaffRole[] => [
  ...SUPPORTED_DASHBOARD_STAFF_ROLES,
];

export const getAssignableDashboardStaffRoles = normalizeDashboardStaffRoles;

export const buildCreateDashboardStaffUserPayload = (
  values: ParsedCreateDashboardStaffUserFormValues
): CreateDashboardStaffUserPayload => ({
  email: values.email,
  password: values.password,
  role: values.role,
  isActive: values.isActive,
});

export const buildUpdateDashboardStaffUserPatch = (
  originalUser: DashboardStaffUserDto,
  values: ParsedEditDashboardStaffUserFormValues
): UpdateDashboardStaffUserPayload => {
  const patch: UpdateDashboardStaffUserPayload = {};

  if (values.email !== originalUser.email) patch.email = values.email;
  if (values.role !== originalUser.role) patch.role = values.role;
  if (values.isActive !== originalUser.isActive) {
    patch.isActive = values.isActive;
  }

  return patch;
};

export const hasUpdatePatchChanges = (patch: UpdateDashboardStaffUserPayload) =>
  Object.keys(patch).length > 0;
