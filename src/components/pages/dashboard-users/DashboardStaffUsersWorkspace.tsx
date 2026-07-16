import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  useForm,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { ToastMessage } from "@/components/global/ToastMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_DEFAULTS } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import {
  dashboardStaffUserKeys,
  useCreateDashboardStaffUserMutation,
  useDashboardStaffUsersQuery,
  useResetDashboardStaffUserPasswordMutation,
  useUpdateDashboardStaffUserMutation,
} from "@/hooks/useDashboardAdminQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { sessionQueryOptions } from "@/lib/authApi";
import { canManageDashboardStaffUsers } from "@/lib/dashboardStaffPermissions";
import type { UserRole } from "@/types/auth";
import type {
  DashboardStaffRole,
  DashboardStaffStatusFilter,
  DashboardStaffUserDto,
  DashboardStaffUsersListParams,
  UpdateDashboardStaffUserPayload,
} from "@/types/dashboardAdminTypes";
import {
  getDashboardStaffUserErrorMessage,
  isDashboardStaffForbiddenError,
} from "@/utils/fetchDashboardUsers";
import {
  DASHBOARD_STAFF_ROLE_LABELS,
  DASHBOARD_STAFF_STATUS_LABELS,
  buildCreateDashboardStaffUserPayload,
  buildUpdateDashboardStaffUserPatch,
  createDashboardStaffUserSchema,
  defaultAssignableRoles,
  editDashboardStaffUserSchema,
  getAssignableDashboardStaffRoles,
  hasUpdatePatchChanges,
  resetDashboardStaffPasswordSchema,
  type CreateDashboardStaffUserFormValues,
  type EditDashboardStaffUserFormValues,
  type ParsedEditDashboardStaffUserFormValues,
  type ResetDashboardStaffPasswordFormValues,
} from "./dashboardStaffUsersModel";

const ALL_ROLES_VALUE = "all-roles";
const ALL_STATUSES_VALUE = "all-statuses";
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "لم يسجل الدخول بعد";

const hasFilters = (
  q: string,
  role: string,
  status: string
) => Boolean(q || role !== ALL_ROLES_VALUE || status !== ALL_STATUSES_VALUE);

export function DashboardStaffUsersWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isVerifiedSuperadmin = canManageDashboardStaffUsers(user);
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<string>(ALL_ROLES_VALUE);
  const [status, setStatus] = React.useState<string>(ALL_STATUSES_VALUE);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<DashboardStaffUserDto | null>(
    null
  );
  const [resetUser, setResetUser] =
    React.useState<DashboardStaffUserDto | null>(null);
  const [statusUser, setStatusUser] =
    React.useState<DashboardStaffUserDto | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 400);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status, limit]);

  const params = React.useMemo<DashboardStaffUsersListParams>(
    () => ({
      page,
      limit,
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...(role !== ALL_ROLES_VALUE
        ? { role: role as DashboardStaffRole }
        : {}),
      ...(status !== ALL_STATUSES_VALUE
        ? { status: status as DashboardStaffStatusFilter }
        : {}),
    }),
    [debouncedSearch, limit, page, role, status]
  );

  const staffQuery = useDashboardStaffUsersQuery(params, isVerifiedSuperadmin);
  const assignableRoles = getAssignableDashboardStaffRoles(
    staffQuery.data?.assignableRoles
  );

  React.useEffect(() => {
    if (!staffQuery.error || !isDashboardStaffForbiddenError(staffQuery.error)) {
      return;
    }

    queryClient.removeQueries({ queryKey: dashboardStaffUserKeys.all });
    queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey });
    ToastMessage(getDashboardStaffUserErrorMessage(staffQuery.error), "error");
  }, [queryClient, staffQuery.error]);

  React.useEffect(() => {
    if (!user || isVerifiedSuperadmin) return;
    navigate({
      to: ROLE_DEFAULTS[user.role as UserRole] ?? "/",
      replace: true,
    });
  }, [isVerifiedSuperadmin, navigate, user]);

  if (!isVerifiedSuperadmin) {
    return (
      <div className="px-4 lg:px-6" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>ليس لديك صلاحية</CardTitle>
            <CardDescription>
              هذه الصفحة متاحة للسوبر أدمن فقط.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const users = staffQuery.data?.data ?? [];
  const meta = staffQuery.data?.meta;
  const currentPage = meta?.page ?? page;
  const totalPages = meta?.totalPages ?? 1;
  const currentLimit = meta?.limit ?? limit;
  const filterActive = hasFilters(debouncedSearch, role, status);

  return (
    <div className="space-y-6 px-4 lg:px-6" dir="rtl">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-sm text-primary">
            <ShieldCheck className="size-4" />
            <span>سوبر أدمن</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            مستخدمو لوحة التحكم
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            إنشاء وإدارة حسابات فريق الإدارة والمطبخ والتوصيل والكاشير.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          إضافة مستخدم
        </Button>
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_180px_160px_auto]">
          <div className="grid gap-2">
            <Label htmlFor="staff-search">
              البحث بالبريد الإلكتروني
            </Label>
            <Input
              id="staff-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالبريد الإلكتروني"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label>الصلاحية</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLES_VALUE}>الكل</SelectItem>
                {assignableRoles.map((item) => (
                  <SelectItem key={item} value={item}>
                    {DASHBOARD_STAFF_ROLE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>الحالة</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_VALUE}>الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch("");
                setRole(ALL_ROLES_VALUE);
                setStatus(ALL_STATUSES_VALUE);
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              إعادة ضبط الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>قائمة المستخدمين</CardTitle>
            <CardDescription>
              {meta ? `إجمالي النتائج: ${meta.total}` : "جار تحميل النتائج"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="staff-page-size" className="text-sm">
              حجم الصفحة
            </Label>
            <Select
              value={String(limit)}
              onValueChange={(value) => setLimit(Number(value))}
            >
              <SelectTrigger id="staff-page-size" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffQuery.isLoading ? (
            <DashboardStaffUsersSkeleton />
          ) : staffQuery.isError ? (
            <ErrorState
              message={getDashboardStaffUserErrorMessage(staffQuery.error)}
              onRetry={() => staffQuery.refetch()}
            />
          ) : users.length === 0 ? (
            <EmptyState
              message={
                filterActive
                  ? "لا توجد نتائج مطابقة للبحث أو الفلاتر الحالية."
                  : "لا يوجد مستخدمون في لوحة التحكم بعد."
              }
            />
          ) : (
            <DashboardStaffUsersTable
              users={users}
              onEdit={setEditUser}
              onResetPassword={setResetUser}
              onStatusChange={setStatusUser}
            />
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              الصفحة {currentPage} من {Math.max(totalPages, 1)} - حجم الصفحة{" "}
              {currentLimit}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage <= 1 || staffQuery.isFetching}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
              >
                السابق
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={currentPage >= totalPages || staffQuery.isFetching}
                onClick={() =>
                  setPage((value) => Math.min(value + 1, totalPages))
                }
              >
                التالي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateDashboardStaffUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        assignableRoles={assignableRoles}
      />
      <EditDashboardStaffUserDialog
        user={editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
        assignableRoles={assignableRoles}
      />
      <DashboardStaffUserStatusDialog
        user={statusUser}
        onOpenChange={(open) => {
          if (!open) setStatusUser(null);
        }}
      />
      <ResetDashboardStaffPasswordDialog
        user={resetUser}
        onOpenChange={(open) => {
          if (!open) setResetUser(null);
        }}
      />
    </div>
  );
}

function DashboardStaffUsersTable({
  users,
  onEdit,
  onResetPassword,
  onStatusChange,
}: {
  users: DashboardStaffUserDto[];
  onEdit: (user: DashboardStaffUserDto) => void;
  onResetPassword: (user: DashboardStaffUserDto) => void;
  onStatusChange: (user: DashboardStaffUserDto) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">البريد الإلكتروني</TableHead>
            <TableHead className="text-right">الصلاحية</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">آخر تسجيل دخول</TableHead>
            <TableHead className="text-right">تاريخ الإنشاء</TableHead>
            <TableHead className="w-16 text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="min-w-60 font-medium" dir="ltr">
                {user.email}
              </TableCell>
              <TableCell>
                {DASHBOARD_STAFF_ROLE_LABELS[user.role]}
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive
                    ? DASHBOARD_STAFF_STATUS_LABELS.active
                    : DASHBOARD_STAFF_STATUS_LABELS.inactive}
                </Badge>
              </TableCell>
              <TableCell className="min-w-48">
                {formatDate(user.lastLoginAt)}
              </TableCell>
              <TableCell className="min-w-40">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="إجراءات المستخدم"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(user)}>
                      <Edit3 className="size-4" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onResetPassword(user)}>
                      <KeyRound className="size-4" />
                      تغيير كلمة المرور
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant={user.isActive ? "destructive" : "default"}
                      onSelect={() => onStatusChange(user)}
                    >
                      {user.isActive ? (
                        <UserX className="size-4" />
                      ) : (
                        <UserCheck className="size-4" />
                      )}
                      {user.isActive ? "تعطيل" : "تفعيل"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CreateDashboardStaffUserDialog({
  open,
  onOpenChange,
  assignableRoles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableRoles: DashboardStaffRole[];
}) {
  const mutation = useCreateDashboardStaffUserMutation();
  const submittingRef = React.useRef(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<CreateDashboardStaffUserFormValues>({
    resolver: zodResolver(createDashboardStaffUserSchema),
    defaultValues: {
      email: "",
      role: "admin",
      password: "",
      confirmPassword: "",
      isActive: true,
    },
    shouldFocusError: true,
  });

  const closeAndCleanup = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        form.reset();
        mutation.reset();
        submittingRef.current = false;
        setShowPassword(false);
      }
      onOpenChange(nextOpen);
    },
    [form, mutation, onOpenChange]
  );

  React.useEffect(() => () => mutation.reset(), [mutation]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const parsedValues = createDashboardStaffUserSchema.parse(values);
      await mutation.mutateAsync(
        buildCreateDashboardStaffUserPayload(parsedValues)
      );
      ToastMessage("تم إضافة مستخدم لوحة التحكم بنجاح.", "success");
      form.reset();
      closeAndCleanup(false);
    } catch (error) {
      ToastMessage(getDashboardStaffUserErrorMessage(error), "error");
    } finally {
      submittingRef.current = false;
    }
  });

  return (
    <Dialog open={open} onOpenChange={closeAndCleanup}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مستخدم</DialogTitle>
          <DialogDescription>
            أنشئ حسابا لفريق لوحة التحكم بدون إرسال أي بيانات إضافية.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormError message={mutation.error} />
          <Field label="البريد الإلكتروني" error={form.formState.errors.email?.message}>
            <Input
              {...form.register("email")}
              type="email"
              autoComplete="email"
              disabled={mutation.isPending}
              dir="ltr"
            />
          </Field>
          <RoleSelectField
            value={form.watch("role")}
            onValueChange={(value) =>
              form.setValue("role", value, { shouldValidate: true })
            }
            roles={assignableRoles}
            disabled={mutation.isPending}
            error={form.formState.errors.role?.message}
          />
          <PasswordFields
            register={form.register}
            errors={form.formState.errors}
            disabled={mutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordLabel="كلمة المرور"
            confirmLabel="تأكيد كلمة المرور"
          />
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="create-is-active">الحساب نشط</Label>
            <Switch
              id="create-is-active"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) =>
                form.setValue("isActive", checked, { shouldValidate: true })
              }
              disabled={mutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => closeAndCleanup(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              إضافة مستخدم
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDashboardStaffUserDialog({
  user,
  onOpenChange,
  assignableRoles,
}: {
  user: DashboardStaffUserDto | null;
  onOpenChange: (open: boolean) => void;
  assignableRoles: DashboardStaffRole[];
}) {
  const mutation = useUpdateDashboardStaffUserMutation();
  const [pendingPatch, setPendingPatch] =
    React.useState<UpdateDashboardStaffUserPayload | null>(null);
  const submittingRef = React.useRef(false);
  const form = useForm<EditDashboardStaffUserFormValues>({
    resolver: zodResolver(editDashboardStaffUserSchema),
    values: {
      email: user?.email ?? "",
      role: user?.role ?? "admin",
      isActive: user?.isActive ?? true,
    },
    shouldFocusError: true,
  });

  React.useEffect(() => () => mutation.reset(), [mutation]);

  if (!user) return null;

  const currentValues = form.watch();
  const patch = buildUpdateDashboardStaffUserPatch(user, {
    email: currentValues.email,
    role: currentValues.role as DashboardStaffRole,
    isActive: currentValues.isActive,
  });
  const saveDisabled =
    mutation.isPending || !hasUpdatePatchChanges(patch) || submittingRef.current;

  const submitPatch = async (patchToSubmit: UpdateDashboardStaffUserPayload) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await mutation.mutateAsync({ id: user.id, data: patchToSubmit });
      ToastMessage("تم تحديث مستخدم لوحة التحكم بنجاح.", "success");
      mutation.reset();
      onOpenChange(false);
    } catch (error) {
      ToastMessage(getDashboardStaffUserErrorMessage(error), "error");
    } finally {
      submittingRef.current = false;
      setPendingPatch(null);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const parsedValues = editDashboardStaffUserSchema.parse(values);
    const nextPatch = buildUpdateDashboardStaffUserPatch(
      user,
      parsedValues as ParsedEditDashboardStaffUserFormValues
    );
    if (!hasUpdatePatchChanges(nextPatch)) return;
    if (Object.prototype.hasOwnProperty.call(nextPatch, "isActive")) {
      setPendingPatch(nextPatch);
      return;
    }
    await submitPatch(nextPatch);
  });

  return (
    <>
      <Dialog open={!!user} onOpenChange={onOpenChange}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل</DialogTitle>
            <DialogDescription>
              استخدم بيانات الصف المحدد، ولا توجد عملية جلب تفاصيل إضافية.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <FormError message={mutation.error} />
            <Field
              label="البريد الإلكتروني"
              error={form.formState.errors.email?.message}
            >
              <Input
                {...form.register("email")}
                type="email"
                autoComplete="email"
                disabled={mutation.isPending}
                dir="ltr"
              />
            </Field>
            <RoleSelectField
              value={form.watch("role")}
              onValueChange={(value) =>
                form.setValue("role", value, { shouldValidate: true })
              }
              roles={assignableRoles}
              disabled={mutation.isPending}
              error={form.formState.errors.role?.message}
            />
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="edit-is-active">الحالة</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {form.watch("isActive") ? "نشط" : "غير نشط"}
                </span>
                <Switch
                  id="edit-is-active"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) =>
                    form.setValue("isActive", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={mutation.isPending}
                />
              </div>
            </div>
            {!hasUpdatePatchChanges(patch) ? (
              <p className="text-sm text-muted-foreground">
                لا توجد تغييرات للحفظ.
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saveDisabled}>
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmStatusChangeDialog
        open={!!pendingPatch}
        isActive={Boolean(pendingPatch?.isActive)}
        isPending={mutation.isPending}
        onCancel={() => setPendingPatch(null)}
        onConfirm={() => {
          if (pendingPatch) void submitPatch(pendingPatch);
        }}
      />
    </>
  );
}

function DashboardStaffUserStatusDialog({
  user,
  onOpenChange,
}: {
  user: DashboardStaffUserDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateDashboardStaffUserMutation();
  const submittingRef = React.useRef(false);
  React.useEffect(() => () => mutation.reset(), [mutation]);

  if (!user) return null;

  const nextActive = !user.isActive;

  const onConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await mutation.mutateAsync({
        id: user.id,
        data: { isActive: nextActive },
      });
      ToastMessage(
        nextActive ? "تم تفعيل المستخدم بنجاح." : "تم تعطيل المستخدم بنجاح.",
        "success"
      );
      onOpenChange(false);
    } catch (error) {
      ToastMessage(getDashboardStaffUserErrorMessage(error), "error");
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <ConfirmStatusChangeDialog
      open={!!user}
      isActive={nextActive}
      isPending={mutation.isPending}
      onCancel={() => onOpenChange(false)}
      onConfirm={onConfirm}
      error={mutation.error}
    />
  );
}

function ResetDashboardStaffPasswordDialog({
  user,
  onOpenChange,
}: {
  user: DashboardStaffUserDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useResetDashboardStaffUserPasswordMutation();
  const submittingRef = React.useRef(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<ResetDashboardStaffPasswordFormValues>({
    resolver: zodResolver(resetDashboardStaffPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    shouldFocusError: true,
  });

  const cleanup = React.useCallback(
    (open: boolean) => {
      if (!open) {
        form.reset();
        mutation.reset();
        submittingRef.current = false;
        setShowPassword(false);
      }
      onOpenChange(open);
    },
    [form, mutation, onOpenChange]
  );

  React.useEffect(() => () => mutation.reset(), [mutation]);

  if (!user) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await mutation.mutateAsync({ id: user.id, password: values.password });
      ToastMessage("تم تغيير كلمة المرور بنجاح.", "success");
      form.reset();
      cleanup(false);
    } catch (error) {
      ToastMessage(getDashboardStaffUserErrorMessage(error), "error");
    } finally {
      submittingRef.current = false;
    }
  });

  return (
    <Dialog open={!!user} onOpenChange={cleanup}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تغيير كلمة المرور</DialogTitle>
          <DialogDescription>
            سيتم تسجيل خروج هذا المستخدم من الجلسات الحالية بعد تغيير كلمة
            المرور.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormError message={mutation.error} />
          <PasswordFields
            register={form.register}
            errors={form.formState.errors}
            disabled={mutation.isPending}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            passwordLabel="كلمة المرور الجديدة"
            confirmLabel="تأكيد كلمة المرور"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => cleanup(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              تغيير كلمة المرور
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmStatusChangeDialog({
  open,
  isActive,
  isPending,
  onCancel,
  onConfirm,
  error,
}: {
  open: boolean;
  isActive: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  error?: unknown;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>{isActive ? "تفعيل" : "تعطيل"}</DialogTitle>
          <DialogDescription>
            {isActive
              ? "هل تريد إعادة تفعيل هذا المستخدم؟"
              : "هل أنت متأكد من تعطيل هذا المستخدم؟ سيتم منعه من استخدام لوحة التحكم فورا."}
          </DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant={isActive ? "default" : "destructive"}
            disabled={isPending}
            onClick={onConfirm}
          >
            {isActive ? "تفعيل" : "تعطيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleSelectField({
  value,
  onValueChange,
  roles,
  disabled,
  error,
}: {
  value: string;
  onValueChange: (role: DashboardStaffRole) => void;
  roles: DashboardStaffRole[];
  disabled: boolean;
  error?: string;
}) {
  const safeRoles = roles.length ? roles : defaultAssignableRoles();

  return (
    <Field label="الصلاحية" error={error}>
      <Select
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(nextValue as DashboardStaffRole)
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {safeRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {DASHBOARD_STAFF_ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

type PasswordFieldValues = {
  password: string;
  confirmPassword: string;
};

function PasswordFields<TValues extends PasswordFieldValues>({
  register,
  errors,
  disabled,
  showPassword,
  setShowPassword,
  passwordLabel,
  confirmLabel,
}: {
  register: UseFormRegister<TValues>;
  errors: Partial<Record<keyof PasswordFieldValues, { message?: string }>>;
  disabled: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  passwordLabel: string;
  confirmLabel: string;
}) {
  const type = showPassword ? "text" : "password";
  return (
    <>
      <Field label={passwordLabel} error={errors.password?.message}>
        <div className="flex gap-2">
          <Input
            {...register("password" as Path<TValues>)}
            type={type}
            autoComplete="new-password"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={
              showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
            }
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>
      </Field>
      <Field label={confirmLabel} error={errors.confirmPassword?.message}>
        <Input
          {...register("confirmPassword" as Path<TValues>)}
          type={type}
          autoComplete="new-password"
          disabled={disabled}
        />
      </Field>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function FormError({ message }: { message: unknown }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {getDashboardStaffUserErrorMessage(message)}
    </p>
  );
}

function DashboardStaffUsersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <p>{message}</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        إعادة المحاولة
      </Button>
    </div>
  );
}
