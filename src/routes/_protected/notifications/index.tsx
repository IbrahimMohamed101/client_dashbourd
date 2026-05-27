import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Loader } from "@/components/global/loader";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  notificationLogsQueryOptions,
  notificationsSummaryQueryOptions,
  useNotificationLogsQuery,
} from "@/hooks/useNotificationsQuery";
import type { NotificationLogFilters } from "@/types/notificationTypes";

const statusVariant = (status: string) => {
  if (status === "failed") return "destructive" as const;
  if (status === "processing") return "secondary" as const;
  return "default" as const;
};

export const Route = createFileRoute("/_protected/notifications/")({
  component: NotificationsPage,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(notificationsSummaryQueryOptions(5)),
      context.queryClient.ensureQueryData(
        notificationLogsQueryOptions({ page: 1, limit: 20 })
      ),
    ]);
  },
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل التنبيهات..." />
  ),
});

function NotificationsPage() {
  const { data: summary } = useSuspenseQuery(
    notificationsSummaryQueryOptions(5)
  );
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<NotificationLogFilters>({
    page: 1,
    limit: 20,
  });
  const { data: logsResponse, isFetching } = useNotificationLogsQuery({
    ...filters,
    page,
    limit: 20,
  });
  const logs = logsResponse?.data ?? [];
  const meta = logsResponse?.meta;

  const updateFilter = (key: keyof NotificationLogFilters, value: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      page: 1,
      [key]: value || undefined,
    }));
  };

  return (
    <div className="space-y-6 px-4 lg:px-6" dir="rtl">
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader>
          <CardTitle>التنبيهات</CardTitle>
          <CardDescription>
            ملخص وسجل التنبيهات من /api/dashboard/notifications/summary و
            /notification-logs.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="آخر 24 ساعة"
          value={summary.data.unreadCount}
          description={`${summary.data.unreadWindowHours} ساعة`}
        />
        <SummaryCard
          label="فاشلة"
          value={summary.data.failedCount}
          description="آخر 7 أيام"
        />
        <SummaryCard
          label="قيد المعالجة"
          value={summary.data.processingCount}
          description="حاليًا"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>آخر التنبيهات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.data.recent.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{item.title}</div>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.body}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("ar-EG")
                    : "-"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل التنبيهات</CardTitle>
            <CardDescription>
              يدعم backend فلاتر userId و entityId و from و to.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <FilterInput
                label="User ID"
                value={filters.userId ?? ""}
                onChange={(value) => updateFilter("userId", value)}
              />
              <FilterInput
                label="Entity ID"
                value={filters.entityId ?? ""}
                onChange={(value) => updateFilter("entityId", value)}
              />
              <FilterInput
                label="من"
                type="date"
                value={filters.from ?? ""}
                onChange={(value) => updateFilter("from", value)}
              />
              <FilterInput
                label="إلى"
                type="date"
                value={filters.to ?? ""}
                onChange={(value) => updateFilter("to", value)}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">نجاح/فشل</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id ?? log.id}>
                      <TableCell>
                        <div className="font-medium">{log.title}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {log.body}
                        </div>
                      </TableCell>
                      <TableCell>{log.type || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.successCount ?? 0}/{log.failureCount ?? 0}
                      </TableCell>
                      <TableCell>
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("ar-EG")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!logs.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center">
                        لا توجد سجلات.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isFetching ? "جاري التحديث..." : `الإجمالي: ${meta?.total ?? 0}`}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  السابق
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={meta ? page >= meta.totalPages : true}
                  onClick={() => setPage((current) => current + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-black">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        dir={type === "text" ? "ltr" : "rtl"}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
