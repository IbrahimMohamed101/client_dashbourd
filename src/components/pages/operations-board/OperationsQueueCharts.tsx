import { AlertCircle, CheckCircle2, Clock3, Layers3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isOneTimeOrder, isPickupRequest } from "@/types/dashboardOpsTypes";

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

function getStatusLabel(item: UnifiedQueueItem) {
  return item.statusLabel || item.ui?.label || item.status || "غير محدد";
}

function getSourceLabel(item: UnifiedQueueItem) {
  if (isPickupRequest(item)) return "استلام فرع";
  if (isOneTimeOrder(item)) return "طلب فردي";
  return "اشتراك يومي";
}

function countByLabel<T>(items: T[], getLabel: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const label = getLabel(item) || "غير محدد";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function getTopLabel(rows: Array<{ label: string; count: number }>) {
  return rows[0]?.label || "لا يوجد";
}

function getActionCounts(items: UnifiedQueueItem[]) {
  const needsAction = items.filter((item) => item.allowedActions?.length).length;
  return {
    needsAction,
    stable: Math.max(0, items.length - needsAction),
  };
}

function getPrimaryActionLabel(items: UnifiedQueueItem[]) {
  const actionRows = countByLabel(
    items.flatMap((item) => item.allowedActions || []),
    (action) => action.label || action.id || "إجراء"
  );
  return getTopLabel(actionRows);
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Layers3;
}) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm transition-colors hover:border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription className="text-xs font-medium">
            {title}
          </CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums">
            {typeof value === "number" ? formatNumber(value) : value}
          </CardTitle>
        </div>
        <span className="rounded-xl bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function OperationsQueueCharts({
  items,
  title = "قراءة سريعة للطابور",
  description = "ملخص بسيط يساعد الفريق يركز على دورة الطلبات بدون رسوم مزدحمة.",
}: {
  items: UnifiedQueueItem[];
  title?: string;
  description?: string;
}) {
  const total = items.length;
  const sourceRows = countByLabel(items, getSourceLabel);
  const statusRows = countByLabel(items, getStatusLabel);
  const { needsAction, stable } = getActionCounts(items);
  const primaryAction = getPrimaryActionLabel(items);

  return (
    <section className="rounded-2xl border bg-card/60 p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
          إجمالي {formatNumber(total)}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="إجمالي الطابور"
          value={total}
          description="عدد الطلبات الظاهرة داخل هذه المرحلة بعد تطبيق صلاحيات الدور والفلاتر."
          icon={Layers3}
        />
        <SummaryCard
          title="يحتاج إجراء"
          value={needsAction}
          description={
            needsAction > 0
              ? `أقرب إجراء متكرر: ${primaryAction}`
              : "لا توجد إجراءات مطلوبة الآن."
          }
          icon={AlertCircle}
        />
        <SummaryCard
          title="بدون تدخل عاجل"
          value={stable}
          description="طلبات موجودة للمتابعة فقط أو لا تحتوي على إجراء مباشر من الباك إند."
          icon={CheckCircle2}
        />
        <SummaryCard
          title="أكثر حالة حالية"
          value={getTopLabel(statusRows)}
          description={`أكثر مصدر ظاهر الآن: ${getTopLabel(sourceRows)}.`}
          icon={Clock3}
        />
      </div>

      {sourceRows.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sourceRows.map((row) => (
            <Badge key={row.label} variant="outline" className="rounded-full">
              {row.label}: {formatNumber(row.count)}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
