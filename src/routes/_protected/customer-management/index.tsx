import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerManagementPage } from "@/features/customer-management/CustomerManagementPage";
import { RetentionSnapshotPage } from "@/features/retention/RetentionSnapshotPage";

type CustomerManagementSearch = { userId?: string; panel?: "profile" };

export const Route = createFileRoute("/_protected/customer-management/")({
  validateSearch: (search: Record<string, unknown>): CustomerManagementSearch => ({
    userId: typeof search.userId === "string" ? search.userId : undefined,
    panel: search.panel === "profile" ? "profile" as const : undefined,
  }),
  component: CustomerManagementRoute,
});

function CustomerManagementRoute() {
  const { userId, panel } = Route.useSearch();
  const [tab, setTab] = React.useState<"retention" | "profile">(
    userId || panel === "profile" ? "profile" : "retention"
  );
  React.useEffect(() => {
    if (userId) setTab("profile");
  }, [userId]);

  return (
    <div className="space-y-4 px-4 lg:px-6" dir="rtl">
      <Tabs value={tab} onValueChange={(value) => setTab(value as "retention" | "profile")}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="retention">التجديدات واستعادة العملاء</TabsTrigger>
          <TabsTrigger value="profile">إدارة بيانات عميل</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "retention" ? (
        <RetentionSnapshotPage onOpenProfile={() => setTab("profile")} />
      ) : (
        <CustomerManagementPage initialUserId={userId} />
      )}
    </div>
  );
}
