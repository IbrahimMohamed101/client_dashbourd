import { AlertCircle, CheckCircle2, Clock3, Layers3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";
import { isOneTimeOrder, isPickupRequest } from "@/types/dashboardOpsTypes";

function formatCount(value: number) {
  return value.toLocaleString("en-US");
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

function SummaryTile({
  title,
  value,
  helper,
  icon: Icon,
  emphasis = "default",
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: typeof Layers3;
  emphasis?: "default" | "action" | "calm";
}) {
  const valueText = typeof value === "number" ? formatCount(value) : value;
  const accentClass =
    emphasis === "action"
      ? "bg-primary/10 text-primary ring-primary/15"
      : emphasis === "calm"
        ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/15"
        : "bg-muted text-muted-foreground ring-border";

  return (
    <div className="group rounded-2xl border border-border/70 bg-background/45 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="truncate text-3xl font-black leading-none tracking-tight text-foreground tabular-nums">
            {valueText}
          </p>
        </div>
        <span className={`rounded-xl p-2 ring-1 ${accentClass}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-5 text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}

export function OperationsQueueCharts({
  items,
  title = "قراءة سريعة للطابور",
  description = "ملخص تشغيلي بسيط يوضح المرحلة بدون تشتيت عن جدول الطلبات.",
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
  const topStatus = getTopLabel(statusRows);
  const topSource = getTopLabel(sourceRows);

  return (
    <section className="rounded-3xl border border-border/70 bg-card/55 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1.5 text-xs font-semibold">
          {formatCount(total)} طلب في هذه المرحلة
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          title="إجمالي الطابور"
          value={total}
          helper={
            total > 0
              ? "عدد الطلبات الظاهرة بعد صلاحيات الدور والفلاتر."
              : "لا توجد طلبات مطابقة في هذه المرحلة حالياً."
          }
          icon={Layers3}
        />
        <SummaryTile
          title="يحتاج إجراء"
          value={needsAction}
          helper={
            needsAction > 0
              ? `أقرب إجراء متكرر: ${primaryAction}`
              : "لا توجد أزرار إجراءات مطلوبة الآن."
          }
          icon={AlertCircle}
          emphasis="action"
        />
        <SummaryTile
          title="بدون تدخل عاجل"
          value={stable}
          helper="طلبات للمتابعة فقط أو لا تحتوي على إجراء مباشر من الباك إند."
          icon={CheckCircle2}
          emphasis="calm"
        />
        <SummaryTile
          title="الحالة الأبرز"
          value={topStatus}
          helper={`أكثر مصدر ظاهر الآن: ${topSource}.`}
          icon={Clock3}
        />
      </div>

      {sourceRows.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
          {sourceRows.map((row) => (
            <Badge key={row.label} variant="outline" className="rounded-full bg-background/40 px-3 py-1">
              {row.label}: {formatCount(row.count)}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
