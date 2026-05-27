import * as React from "react";
import { DataTable } from "@/components/pages/dashboard/data-table";
import { createFileRoute } from "@tanstack/react-router";

import { SectionCards } from "@/components/custom/section-cards";
import { dashboardSectionCards } from "@/constants/SectionCardsData";
import {
  subscriptionColumns,
  orderColumns,
} from "@/components/pages/dashboard/activity-columns";
import { dashboardQueryOptions } from "@/hooks/useDashboardQuery";
import { Loader } from "@/components/global/loader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { mapDashboardStatsToCards } from "@/lib/dashboardStats";

export const Route = createFileRoute("/_protected/dashboard")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions()),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل البيانات..." />
  ),
});

function RouteComponent() {
  const { data: dashboardResponse } = useSuspenseQuery(dashboardQueryOptions());
  const [activeTab, setActiveTab] = React.useState("subscriptions");

  const dashboardData = dashboardResponse?.data;
  const stats = dashboardData?.stats;

  const mappedCardsData = mapDashboardStatsToCards(dashboardSectionCards, stats);

  const tableData =
    activeTab === "subscriptions"
      ? dashboardData?.recentSubscriptions || []
      : dashboardData?.recentOrders || [];

  const columns =
    activeTab === "subscriptions" ? subscriptionColumns : orderColumns;

  return (
    <>
      <SectionCards cardsData={mappedCardsData} />

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
    </>
  );
}
