import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/pages/dashboard/data-table";
import { SectionCards } from "@/components/custom/section-cards";
import { dashboardSectionCards } from "@/constants/SectionCardsData";
import {
  subscriptionColumns,
  orderColumns,
} from "@/components/pages/dashboard/activity-columns";
import { dashboardQueryOptions } from "@/hooks/useDashboardQuery";
import { Loader } from "@/components/global/loader";
import { mapDashboardStatsToCards } from "@/lib/dashboardStats";
import { EmptyState } from "@/components/ui/empty-state";
import { RouteError } from "@/components/global/RouteError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardOverviewCharts } from "@/components/pages/dashboard/dashboard-overview-charts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_protected/dashboard")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions()),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل البيانات..." />
  ),
  errorComponent: RouteError,
});

function RouteComponent() {
  const { data: dashboardResponse } = useSuspenseQuery(dashboardQueryOptions());
  const [activeTab, setActiveTab] = React.useState("subscriptions");

  const dashboardData = dashboardResponse?.data;

  if (!dashboardData) {
    return (
      <div className="px-4 lg:px-6" dir="rtl">
        <EmptyState
          title="لا توجد بيانات للوحة"
          description="لم يرجع الخادم بنموذج بيانات الواجهة الرئيسية."
        />
      </div>
    );
  }

  const recentSubscriptions = dashboardData.recentSubscriptions ?? [];
  const recentOrders = dashboardData.recentOrders ?? [];
  const mappedCardsData = mapDashboardStatsToCards(
    dashboardSectionCards,
    dashboardData.stats
  );

  const tableData =
    activeTab === "subscriptions" ? recentSubscriptions : recentOrders;
  const columns =
    activeTab === "subscriptions" ? subscriptionColumns : orderColumns;

  return (
    <div className="flex flex-col gap-5 pb-6" dir="rtl">
      <div className="px-4 lg:px-6">
        <Card className="rounded-lg bg-card">
          <CardHeader className="gap-3 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-2xl font-semibold tracking-normal">
                  لوحة التحكم
                </CardTitle>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  نظرة عامة على حالة المطعم والطلبات والاشتراكات
                </p>
              </div>
              {dashboardData.today && (
                <Badge
                  variant="secondary"
                  className="w-fit font-medium tabular-nums"
                >
                  {dashboardData.today}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <span>
              كل الأرقام والجداول في هذه الصفحة معروضة مباشرة من ملخص الخادم الحالي.
            </span>
          </CardContent>
        </Card>
      </div>

      <SectionCards cardsData={mappedCardsData} />

      <DashboardOverviewCharts data={dashboardData} />

      <DataTable
        columns={
          columns as unknown as React.ComponentProps<
            typeof DataTable
          >["columns"]
        }
        data={
          tableData as unknown as React.ComponentProps<typeof DataTable>["data"]
        }
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
