import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useResetDashboardStaffUserPasswordMutation } from "@/hooks/useDashboardAdminQuery";

export const Route = createFileRoute("/_protected/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const resetPassword = useResetDashboardStaffUserPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const canResetPassword = user?.role === "admin" || user?.role === "superadmin";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    resetPassword.mutate(
      { id: user.id, password },
      {
        onSuccess: () => {
          toast.success("تم تحديث كلمة المرور");
          setPassword("");
          setConfirmPassword("");
        },
        onError: (
          err: Error & { response?: { data?: { message?: string } } }
        ) => {
          toast.error(
            err.response?.data?.message || "تعذر تحديث كلمة المرور"
          );
        },
      }
    );
  };

  return (
    <div className="space-y-6 px-4 lg:px-6" dir="rtl">
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
          <CardDescription>
            بيانات الحساب من /api/dashboard/auth/me.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="البريد الإلكتروني" value={user?.email ?? "-"} />
            <InfoRow label="الدور" value={user?.role ?? "-"} />
            <InfoRow
              label="آخر دخول"
              value={
                user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString("ar-EG")
                  : "-"
              }
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الحالة</span>
              <Badge variant={user?.isActive ? "default" : "destructive"}>
                {user?.isActive ? "نشط" : "غير نشط"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تغيير كلمة المرور</CardTitle>
            <CardDescription>
              يستخدم endpoint إعادة تعيين كلمة مرور مستخدمي اللوحة.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canResetPassword && (
              <div className="mb-4 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                backend الحالي يسمح بهذا الإجراء لأدوار admin/superadmin فقط.
              </div>
            )}
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={!canResetPassword}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  disabled={!canResetPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    !canResetPassword ||
                    resetPassword.isPending ||
                    !password ||
                  !confirmPassword
                }
              >
                  {resetPassword.isPending
                    ? "جاري الحفظ..."
                    : "تحديث كلمة المرور"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate font-medium" dir="ltr">
        {value}
      </span>
    </div>
  );
}
