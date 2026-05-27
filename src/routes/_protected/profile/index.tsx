import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SaveIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useResetDashboardStaffUserPasswordMutation } from "@/hooks/useDashboardAdminQuery";
import { UserRoles } from "@/types/auth";

export const Route = createFileRoute("/_protected/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const resetPassword = useResetDashboardStaffUserPasswordMutation();
  const [password, setPassword] = useState("");
  const canResetPassword =
    user?.role === UserRoles.ADMIN || user?.role === UserRoles.SUPERADMIN;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id || !password.trim()) return;

    try {
      await resetPassword.mutateAsync({ id: user.id, password });
      setPassword("");
      toast.success("تم تحديث كلمة المرور بنجاح");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "تعذر تحديث كلمة المرور";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4 px-4 text-right lg:px-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">الملف الشخصي</h1>
          <p className="text-sm text-muted-foreground">
            بيانات حساب لوحة التحكم الحالي.
          </p>
        </div>
        <UserIcon className="size-6 text-muted-foreground" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail label="البريد الإلكتروني" value={user?.email} />
            <Detail label="الدور" value={translateRole(user?.role)} />
            <Detail label="نشط" value={user?.isActive ? "نعم" : "لا"} />
            <Detail label="آخر تسجيل دخول" value={formatDate(user?.lastLoginAt)} />
            <Detail label="تاريخ الإنشاء" value={formatDate(user?.createdAt)} />
          </CardContent>
        </Card>

        {canResetPassword ? (
          <Card>
            <CardHeader>
              <CardTitle>إعادة تعيين كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <Input
                    id="password"
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={resetPassword.isPending || password.length < 8}
                >
                  <SaveIcon className="size-4" />
                  تحديث كلمة المرور
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>كلمة المرور</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              إعادة تعيين كلمة المرور متاحة لحسابات المدير والمدير العام فقط.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-left font-medium">{String(value ?? "-")}</span>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar-EG");
}

function translateRole(value: unknown) {
  const role = String(value ?? "");
  const labels: Record<string, string> = {
    admin: "مدير",
    superadmin: "مدير عام",
    kitchen: "المطبخ",
    courier: "مندوب",
  };
  return labels[role] ?? role;
}
