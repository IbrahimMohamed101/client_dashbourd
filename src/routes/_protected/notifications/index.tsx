import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dashboardNotificationLogsQueryOptions,
  dashboardNotificationSummaryQueryOptions,
} from "@/hooks/useDashboardAdminQuery";
import type { JsonObject } from "@/types/dashboardAdminTypes";

export const Route = createFileRoute("/_protected/notifications/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [page, setPage] = useState(1);
  const summaryQuery = useQuery(dashboardNotificationSummaryQueryOptions(10));
  const logsQuery = useQuery(
    dashboardNotificationLogsQueryOptions({ page, limit: 20 })
  );

  const summary = summaryQuery.data?.data;
  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;

  return (
    <div className="space-y-4 px-4 text-right lg:px-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            الإشعارات
          </h1>
          <p className="text-sm text-muted-foreground">
            متابعة حالة الإشعارات وآخر عمليات الإرسال وسجلات التسليم.
          </p>
        </div>
        <BellIcon className="size-6 text-muted-foreground" />
      </div>

      {summaryQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : summaryQuery.isError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            تعذر تحميل ملخص الإشعارات.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="آخر 24 ساعة"
            value={summary?.unreadCount ?? 0}
            note="سجلات الإشعارات الحديثة"
          />
          <MetricCard
            title="فشلت"
            value={summary?.failedCount ?? 0}
            note="إشعارات فشلت خلال آخر 7 أيام"
          />
          <MetricCard
            title="قيد المعالجة"
            value={summary?.processingCount ?? 0}
            note="إشعارات تتم معالجتها حالياً"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>آخر الإشعارات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.recent ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد إشعارات حديثة.
              </p>
            ) : (
              summary?.recent.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.title}</span>
                    <span className="rounded-md bg-muted px-2 py-1 text-xs">
                      {translateStatus(item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.recentActivity ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد نشاطات حديثة.
              </p>
            ) : (
              summary?.recentActivity.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {translateRole(item.byRole)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {item.entityType} {item.entityId}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>سجلات الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logsQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : logsQuery.isError ? (
            <p className="text-sm text-destructive">
              تعذر تحميل سجلات الإشعارات.
            </p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد سجلات إشعارات.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium">العنوان</th>
                    <th className="px-3 py-2 text-right font-medium">الحالة</th>
                    <th className="px-3 py-2 text-right font-medium">النوع</th>
                    <th className="px-3 py-2 text-right font-medium">العنصر</th>
                    <th className="px-3 py-2 text-right font-medium">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={String(log._id ?? log.id ?? index)} className="border-t">
                      <td className="px-3 py-2">{cell(log, "title")}</td>
                      <td className="px-3 py-2">{translateStatus(cell(log, "status"))}</td>
                      <td className="px-3 py-2">{cell(log, "type")}</td>
                      <td className="px-3 py-2">
                        {cell(log, "entityType")} {cell(log, "entityId")}
                      </td>
                      <td className="px-3 py-2">
                        {formatDate(cell(log, "createdAt"))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              صفحة {meta?.page ?? page} من {meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeftIcon className="size-4" />
                السابق
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta ? page >= meta.totalPages : false}
                onClick={() => setPage((current) => current + 1)}
              >
                التالي
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function cell(log: JsonObject, key: string) {
  const value = log[key];
  if (value === null || value === undefined) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ar-EG");
}

function translateStatus(value: unknown) {
  const status = String(value ?? "");
  const labels: Record<string, string> = {
    sent: "تم الإرسال",
    delivered: "تم التسليم",
    failed: "فشل",
    processing: "قيد المعالجة",
    pending: "قيد الانتظار",
    unread: "غير مقروء",
    read: "مقروء",
    completed: "مكتمل",
  };
  return labels[status] ?? status;
}

function translateRole(value: unknown) {
  const role = String(value ?? "system");
  const labels: Record<string, string> = {
    system: "النظام",
    admin: "مدير",
    superadmin: "مدير عام",
    kitchen: "المطبخ",
    courier: "مندوب",
  };
  return labels[role] ?? role;
}
