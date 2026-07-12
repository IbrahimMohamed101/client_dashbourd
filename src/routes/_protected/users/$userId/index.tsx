import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { userDetailsQueryOptions } from "@/hooks/useUsersQuery";
import { Loader } from "@/components/global/loader";
import { ToastMessage } from "@/components/global/ToastMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { resetUserPassword } from "@/utils/fetchUsersData";
import {
  ArrowRightIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";

export const Route = createFileRoute("/_protected/users/$userId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(userDetailsQueryOptions(params.userId));
  },
  pendingComponent: Loader,
  component: UserDetailsPage,
});

function UserDetailsPage() {
  const { userId } = Route.useParams();
  const { data: response } = useSuspenseQuery(userDetailsQueryOptions(userId));

  const user = response.data;

  return (
    <div className="flex-1 space-y-6 px-4 pt-4 lg:px-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="shrink-0 rounded-full"
          >
            <Link to="/users">
              <ArrowRightIcon className="size-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {user.fullName}
              </h1>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "نشط" : "غير نشط"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              تفاصيل المستخدم والاشتراكات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/users/$userId/create-subscription" params={{ userId }}>
              <PlusCircleIcon className="ml-1 size-4" />
              إنشاء اشتراك
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="size-4" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">{user.fullName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon className="size-4 text-muted-foreground" />
              <span dir="ltr" className="font-medium">
                {user.phone}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MailIcon className="size-4 text-muted-foreground" />
              <span className="font-medium">{user.email || "غير متوفر"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheckIcon className="size-4" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الدور</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الحالة</span>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "نشط" : "غير نشط"}
              </Badge>
            </div>
            {user.forcePasswordChange && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">كلمة المرور</span>
                <Badge
                  variant="outline"
                  className="border-amber-400 text-amber-600"
                >
                  مؤقتة - بانتظار التغيير
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">حالة الحساب</span>
              <Badge variant="outline">{user.accountStatus || "active"}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">معرف المستخدم</span>
              <span className="font-mono text-xs">{user.id?.slice(-8)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="size-4" />
              الاشتراكات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">إجمالي الاشتراكات</span>
              <span className="text-lg font-bold">
                {user.subscriptionsCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الاشتراكات النشطة</span>
              <span className="text-lg font-bold text-emerald-600">
                {user.activeSubscriptionsCount}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">تاريخ الانضمام:</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </CardContent>
        </Card>

        <ResetPasswordCard userId={userId} />
      </div>
    </div>
  );
}

function ResetPasswordCard({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const resetPassword = useMutation({
    mutationFn: () => resetUserPassword({ userId, password, reason }),
    onSuccess: () => {
      setPassword("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["user-details", userId] });
      ToastMessage("تم إعادة تعيين كلمة المرور بنجاح", "success");
    },
    onError: (error: unknown) => {
      ToastMessage(
        getApiErrorMessage(error) || "حدث خطأ أثناء إعادة تعيين كلمة المرور",
        "error"
      );
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheckIcon className="size-4" />
          إعادة تعيين كلمة المرور
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          أدخل كلمة مرور مؤقتة للمستخدم. سيُطلب منه تغييرها عند أول تسجيل دخول.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">كلمة المرور المؤقتة</label>
          <Input
            type="password"
            dir="ltr"
            placeholder="أدخل كلمة مرور مؤقتة (6 أحرف على الأقل)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            className="text-left"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">سبب الإعادة (اختياري)</label>
          <Input
            type="text"
            placeholder="سبب إعادة التعيين"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={password.length < 6 || resetPassword.isPending}
          onClick={() => resetPassword.mutate()}
          className="w-full"
        >
          {resetPassword.isPending
            ? "جاري الإعادة..."
            : "إعادة تعيين كلمة المرور"}
        </Button>
      </CardContent>
    </Card>
  );
}
