import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DownloadIcon, ReceiptTextIcon, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccountingDailyReportQuery } from "@/hooks/useDashboardAdminQuery";
import type { AccountingDailyReportParams } from "@/types/dashboardAdminTypes";
import {
  fetchAccountingDailyReportExport,
  resolveAccountingDailyReportParams,
} from "@/utils/fetchDashboardSupportData";

type ReportRecord = Record<string, unknown>;

const initialParams = resolveAccountingDailyReportParams({
  includeDetails: true,
  fulfillmentMethod: "all",
});

const asRecord = (value: unknown): ReportRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as ReportRecord)
    : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const titleFromKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const previewEntries = (record: ReportRecord, limit = 6) =>
  Object.entries(record).slice(0, limit);

export const Route = createFileRoute("/_protected/accounting/")({
  component: AccountingPage,
});

function AccountingPage() {
  const [date, setDate] = useState(String(initialParams.date));
  const [fulfillmentMethod, setFulfillmentMethod] = useState(
    String(initialParams.fulfillmentMethod)
  );
  const [isExporting, setIsExporting] = useState(false);

  const params = useMemo<AccountingDailyReportParams>(
    () => ({
      date,
      fulfillmentMethod,
      includeDetails: true,
    }),
    [date, fulfillmentMethod]
  );
  const { data, isLoading, isError, refetch, isFetching } =
    useAccountingDailyReportQuery(params);
  const report = asRecord(data?.data);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await fetchAccountingDailyReportExport(params);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `daily-accounting-report-${date}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Daily Accounting
          </h1>
          <p className="text-sm text-muted-foreground">
            Contract-backed daily report with export support for finance
            reconciliation.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="accounting-date">Business date</Label>
            <Input
              id="accounting-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fulfillment</Label>
            <Select
              value={fulfillmentMethod}
              onValueChange={setFulfillmentMethod}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className="size-4" />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={isExporting || isLoading}>
            <DownloadIcon className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <AccountingSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Unable to load the accounting daily report.
          </CardContent>
        </Card>
      ) : (
        <AccountingReport report={report} />
      )}
    </div>
  );
}

function AccountingReport({ report }: { report: ReportRecord }) {
  const summary = asRecord(report.summary);
  const money = asRecord(report.money);
  const oneTimeOrders = asRecord(report.oneTimeOrders);
  const subscriptions = asRecord(report.subscriptions);
  const reconciliation = asRecord(report.reconciliation);
  const orderItems = asArray(oneTimeOrders.items);
  const manualDeductions = asArray(subscriptions.manualDeductions);
  const warnings = asArray(report.warnings);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Business date</p>
            <p className="text-xl font-semibold tracking-normal">
              {formatValue(report.businessDate)}
            </p>
          </div>
          <Badge variant="outline">
            {warnings.length} warning{warnings.length === 1 ? "" : "s"}
          </Badge>
        </CardContent>
      </Card>

      {warnings.length > 0 ? (
        <Alert>
          <ReceiptTextIcon className="size-4" />
          <AlertTitle>Backend warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc">
              {warnings.map((warning, index) => (
                <li key={index}>{formatValue(warning)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <MetricGrid title="Summary" record={summary} />
      <MetricGrid title="Money" record={money} />
      <MetricGrid title="Reconciliation" record={reconciliation} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RecordTable
          title="One-Time Orders"
          rows={orderItems}
          emptyLabel="No one-time order items returned."
        />
        <RecordTable
          title="Manual Deductions"
          rows={manualDeductions}
          emptyLabel="No manual deductions returned."
        />
      </div>
    </div>
  );
}

function MetricGrid({ title, record }: { title: string; record: ReportRecord }) {
  const entries = previewEntries(record, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {title.toLowerCase()} fields returned.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {entries.map(([key, value]) => (
              <div key={key} className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">
                  {titleFromKey(key)}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-normal">
                  {formatValue(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecordTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: unknown[];
  emptyLabel: string;
}) {
  const records = rows.map(asRecord);
  const columns = Array.from(
    records.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  ).slice(0, 7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {records.length === 0 || columns.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{titleFromKey(column)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AccountingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
