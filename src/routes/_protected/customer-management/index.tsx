import * as React from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerManagementPage } from "@/features/customer-management/CustomerManagementPage";
import { LiveRetentionPage } from "@/features/retention/LiveRetentionPage";
import { LIVE_RETENTION_STATUSES, type RetentionFilterStatus } from "@/features/retention/liveRetentionApi";

type Panel = "live" | "profile";
type CustomerManagementSearch = {
  userId?: string;
  panel?: "profile" | "october";
  retentionStatus?: RetentionFilterStatus;
};
export const Route = createFileRoute("/_protected/customer-management/")({
  validateSearch: (search: Record<string, unknown>): CustomerManagementSearch => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
    panel: search.panel === "profile" || search.panel === "october" ? search.panel : undefined,
    retentionStatus: search.retentionStatus === "all"
      || LIVE_RETENTION_STATUSES.some((status) => status === search.retentionStatus)
      ? search.retentionStatus as RetentionFilterStatus : undefined,
  }),
  component: CustomerManagementRoute,
});

function CustomerManagementRoute() {
  const navigate = useNavigate();
  const { userId, panel, retentionStatus } = Route.useSearch();
  const [tab, setTab] = React.useState<Panel>(userId || panel === "profile" ? "profile" : "live");
  React.useEffect(() => {
    if (panel === "october") {
      void navigate({ to: "/retention-reports", replace: true });
    } else if (userId || panel === "profile") {
      setTab("profile");
    } else if (retentionStatus) {
      setTab("live");
    }
  }, [userId, panel, retentionStatus, navigate]);

  return (
    <div className="space-y-4 px-4 lg:px-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">العملاء والتجديدات</h1>
        <Link to="/retention-reports" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted">
          <ClipboardList className="size-4" /> تقرير أكتوبر 2026
        </Link>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as Panel)} dir="rtl">
        <TabsList dir="rtl" className="h-auto max-w-full flex-wrap gap-2 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="live" className="min-h-10 px-5 text-sm">متابعة التجديدات الحالية</TabsTrigger>
          <TabsTrigger value="profile" className="min-h-10 px-5 text-sm">إدارة بيانات عميل</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "live" ? <LiveRetentionPage initialStatus={retentionStatus || "all"} />
        : <CustomerManagementPage initialUserId={userId} />}
    </div>
  );
}
