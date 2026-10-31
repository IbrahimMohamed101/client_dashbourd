import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerManagementPage } from "@/features/customer-management/CustomerManagementPage";
import { RetentionSnapshotPage } from "@/features/retention/RetentionSnapshotPage";
import { LiveRetentionPage } from "@/features/retention/LiveRetentionPage";

type CustomerManagementSearch = { userId?: string; panel?: "profile" | "october" };
type Panel = "live" | "october" | "profile";

export const Route = createFileRoute("/_protected/customer-management/")({
  validateSearch: (search: Record<string, unknown>): CustomerManagementSearch => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
    panel: search.panel === "profile" || search.panel === "october" ? search.panel : undefined,
  }),
  component: CustomerManagementRoute,
});

function CustomerManagementRoute() {
  const { userId, panel } = Route.useSearch();
  const [tab, setTab] = React.useState<Panel>(
    userId || panel === "profile" ? "profile" : panel === "october" ? "october" : "live"
  );
  React.useEffect(() => {
    if (userId) setTab("profile");
    else if (panel === "october") setTab("october");
    else if (panel === "profile") setTab("profile");
  }, [userId, panel]);

  return (
    <div className="space-y-4 px-4 lg:px-6" dir="rtl">
      <Tabs value={tab} onValueChange={(value) => setTab(value as Panel)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="live">متابعة التجديدات الحالية</TabsTrigger>
          <TabsTrigger value="october">تدقيق أكتوبر 2026</TabsTrigger>
          <TabsTrigger value="profile">إدارة بيانات عميل</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "live" ? (
        <LiveRetentionPage />
      ) : tab === "october" ? (
        <RetentionSnapshotPage onOpenProfile={() => setTab("profile")} />
      ) : (
        <CustomerManagementPage initialUserId={userId} />
      )}
    </div>
  );
}
