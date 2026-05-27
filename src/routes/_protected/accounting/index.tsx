import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader } from "@/components/global/loader";
import { accountingDailyReportQueryOptions } from "@/hooks/useDashboardAdminQuery";
import {
  fetchAccountingDailyReportExport,
  resolveAccountingDailyReportParams,
} from "@/utils/fetchDashboardSupportData";

const accountingReportParams = resolveAccountingDailyReportParams({
  includeDetails: true,
});

export const Route = createFileRoute("/_protected/accounting/")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      accountingDailyReportQueryOptions(accountingReportParams)
    ),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جارٍ تحميل التقرير المحاسبي..." />
  ),
});

function RouteComponent() {
  const { data } = useSuspenseQuery(
    accountingDailyReportQueryOptions(accountingReportParams)
  );
  const report = data.data;

  const handleExport = async () => {
    const blob = await fetchAccountingDailyReportExport(accountingReportParams);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daily-accounting-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <Card className="border-none bg-gradient-to-l from-primary/10 via-background to-background shadow-none">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>التقرير المحاسبي اليومي</CardTitle>
            <CardDescription>
              هذه الصفحة الهيكلية مرتبطة بـ
              {" "}
              <code>/api/dashboard/accounting/daily-report</code>
              {" "}
              و
              {" "}
              <code>/export</code>
              {" "}
              بصيغة CSV فقط.
            </CardDescription>
          </div>
          <Button onClick={handleExport}>تصدير CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div className="mb-3 text-sm text-muted-foreground">
              الحمولة المعروضة أدناه هي الاستجابة المؤكدة من backend.
            </div>
            <pre className="overflow-x-auto text-xs leading-6">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
