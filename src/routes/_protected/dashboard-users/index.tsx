import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader } from "@/components/global/loader";
import { dashboardStaffUsersQueryOptions } from "@/hooks/useDashboardAdminQuery";

export const Route = createFileRoute("/_protected/dashboard-users/")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardStaffUsersQueryOptions(1, 20)),
  pendingComponent: () => (
    <Loader
      variant="full-screen"
      label="جارٍ تحميل مستخدمي لوحة التحكم..."
    />
  ),
});

function RouteComponent() {
  const { data } = useSuspenseQuery(dashboardStaffUsersQueryOptions(1, 20));
  const users = data.data;
  const activeUsers = users.filter((user) => user.isActive).length;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader>
          <CardTitle>إدارة مستخدمي اللوحة</CardTitle>
          <CardDescription>
            صفحة هيكلية مرتبطة بعقود backend المؤكدة لـ
            {" "}
            <code>/api/dashboard/dashboard-users</code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <StatCard label="إجمالي المستخدمين" value={data.meta.total} />
          <StatCard label="الحسابات النشطة" value={activeUsers} />
          <StatCard label="الصفحات الكلية" value={data.meta.totalPages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آخر 20 مستخدم</CardTitle>
          <CardDescription>
            تم ربط الجلب بالقائمة الفعلية من backend. يمكن البناء فوق هذا
            السطح لإكمال CRUD UI لاحقًا بدون تغيير العقد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-muted-foreground">
                  الدور: {user.role}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "نشط" : "غير نشط"}
                </Badge>
                <Badge variant="outline">
                  آخر تغيير كلمة مرور:{" "}
                  {user.passwordChangedAt
                    ? new Date(user.passwordChangedAt).toLocaleString("ar-EG")
                    : "غير متوفر"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}
